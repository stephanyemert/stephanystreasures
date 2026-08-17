// Netlify Build Plugin — Stripe catalog sync
//
// Runs after every successful deploy. Reads public/data/products.json and
// upserts a matching Stripe Product (+ active Price) for each entry, keyed by
// the product's `id` stored in Stripe metadata.local_id.
//
// This is what makes "publish in the CMS" also mean "synced to Stripe": a CMS
// save commits products.json to git -> Netlify builds & deploys -> this plugin
// runs and pushes the current catalog state into Stripe.
//
// Requires STRIPE_SECRET_KEY to be set as a Netlify environment variable
// (the same one used by src/pages/api/create-checkout-session.ts).

import fs from "fs";
import path from "path";
import Stripe from "stripe";

const BASE_URL = "https://stephanystreasures.com";

function normalizeImagePath(imagePath) {
  if (!imagePath) return null;
  const clean = imagePath.replace(/^\.*\//, "").replace(/^\//, "");
  return `${BASE_URL}/${clean}`;
}

export default {
  onSuccess: async ({ utils }) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      console.log(
        "[stripe-sync] STRIPE_SECRET_KEY is not set — skipping Stripe sync. " +
          "Set it in Netlify: Project configuration -> Environment variables."
      );
      return;
    }

    const stripe = new Stripe(secretKey);

    const productsPath = path.join(process.cwd(), "public/data/products.json");

    let products;
    try {
      products = JSON.parse(fs.readFileSync(productsPath, "utf8")).products;
    } catch (err) {
      return utils.build.failPlugin(
        "[stripe-sync] Could not read or parse public/data/products.json",
        { error: err }
      );
    }

    let synced = 0;
    let failed = 0;

    for (const item of products) {
      try {
        // Find any existing Stripe product previously created for this local id.
        const search = await stripe.products.search({
          query: `metadata['local_id']:'${item.id}'`,
        });

        const imageUrl = normalizeImagePath(item.image);
        const productPayload = {
          name: item.name,
          description: item.description || undefined,
          images: imageUrl ? [imageUrl] : [],
          // Sold-out or removed items are archived in Stripe rather than deleted,
          // so records/reporting stay intact.
          active: !item.soldOut,
          metadata: {
            local_id: item.id,
            category: item.category || "",
            quantity: String(item.quantity ?? 1),
          },
        };

        let stripeProduct;
        if (search.data.length > 0) {
          stripeProduct = await stripe.products.update(search.data[0].id, productPayload);
        } else {
          stripeProduct = await stripe.products.create(productPayload);
        }

        // Stripe prices are immutable, so keep exactly one active price that
        // matches the current amount instead of editing one in place.
        const existingPrices = await stripe.prices.list({
          product: stripeProduct.id,
          active: true,
          limit: 100,
        });

        const upToDate = existingPrices.data.some(
          (price) => price.unit_amount === item.price && price.currency === "usd"
        );

        if (!upToDate) {
          await Promise.all(
            existingPrices.data.map((stale) =>
              stripe.prices.update(stale.id, { active: false })
            )
          );
          await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: item.price,
            currency: "usd",
          });
        }

        synced += 1;
        console.log(`[stripe-sync] Synced "${item.name}" (${item.id}) -> ${stripeProduct.id}`);
      } catch (err) {
        failed += 1;
        console.log(`[stripe-sync] Failed to sync "${item.id}": ${err.message}`);
      }
    }

    console.log(`[stripe-sync] Done. ${synced} synced, ${failed} failed.`);

    if (failed > 0) {
      // Don't fail the whole deploy over a Stripe sync issue — the site itself
      // built and deployed fine. Just surface it clearly in the deploy log.
      console.log(
        "[stripe-sync] Some products failed to sync to Stripe. Check the log above for details."
      );
    }
  },
};