export const prerender = false;

import type { APIRoute } from "astro";
import Stripe from "stripe";
import { markSoldOut } from "../../lib/soldOut";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);
const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Missing signature or secret" }), {
      status: 400,
    });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
      status: 400,
    });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Read the product IDs we stored in session metadata at checkout creation time
    const productIds = session.metadata?.product_ids;
    if (productIds) {
      const ids = productIds.split(",").map(id => id.trim()).filter(Boolean);
      for (const id of ids) {
        await markSoldOut(id);
        console.log(`Marked sold out: ${id}`);
      }
    } else {
      console.warn("Webhook: no product_ids found in session metadata", session.id);
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};