import 'dotenv/config';
import Stripe from "stripe";
import fs from "fs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const BASE_URL = "https://stephanystreasures.com";

const { products } = JSON.parse(
  fs.readFileSync("./public/data/products.json", "utf8")
);

function normalizeImagePath(path) {
  if (!path) return null;
  const clean = path.replace(/^\.*\//, "").replace(/^\//, "");
  return `${BASE_URL}/${clean}`;
}

async function migrate() {
  for (const p of products) {
    const imageUrl = normalizeImagePath(p.image);

    const product = await stripe.products.create({
      name: p.name,
      description: p.description,
      images: imageUrl ? [imageUrl] : [],
      metadata: {
        local_id: p.id,
        category: p.category,
        quantity: String(p.quantity)
      }
    });

    await stripe.prices.create({
      product: product.id,
      unit_amount: p.price,
      currency: "usd"
    });

    console.log(`Created: ${p.name} → ${product.id}`);
  }
}

migrate();