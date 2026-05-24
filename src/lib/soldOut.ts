/**
 * Sold-out state is stored in a Netlify environment variable: SOLD_OUT_IDS
 * Format: comma-separated product IDs, e.g. "magnesium-spray-emert-farms,some-other-id"
 * 
 * To relist an item: go to Netlify → Project configuration → Environment variables
 * → find SOLD_OUT_IDS → remove the product ID from the comma-separated list.
 * 
 * To mark sold out programmatically (from success page), we call the Netlify API
 * to update the env var.
 */

const SITE_ID = import.meta.env.NETLIFY_SITE_ID;
const NETLIFY_TOKEN = import.meta.env.NETLIFY_API_TOKEN;

function getSoldOutIds(): string[] {
  const raw = import.meta.env.SOLD_OUT_IDS ?? "";
  return raw.split(",").map((s: string) => s.trim()).filter(Boolean);
}

export function isProductSoldOut(productId: string): boolean {
  return getSoldOutIds().includes(productId);
}

export async function markSoldOut(productId: string): Promise<void> {
  const current = getSoldOutIds();
  if (current.includes(productId)) return;

  const updated = [...current, productId].join(",");

  // Update the env var via Netlify API
  const res = await fetch(
    `https://api.netlify.com/api/v1/sites/${SITE_ID}/env/SOLD_OUT_IDS`,
    {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${NETLIFY_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value: updated,
        context: "all",
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Netlify API error ${res.status}: ${text}`);
  }
}