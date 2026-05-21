import { getStore } from "@netlify/blobs";

const STORE_NAME = "sold-out";
const KEY = "state";

type SoldOutState = Record<string, boolean>;

async function getBlobStore() {
  return getStore(STORE_NAME);
}

export async function getSoldOutState(): Promise<SoldOutState> {
  try {
    const store = await getBlobStore();
    const raw = await store.get(KEY, { type: "text" });
    if (!raw) return {};
    return JSON.parse(raw) as SoldOutState;
  } catch {
    return {};
  }
}

export async function markSoldOut(productId: string): Promise<void> {
  const store = await getBlobStore();
  const current = await getSoldOutState();
  current[productId] = true;
  await store.set(KEY, JSON.stringify(current));
}

export async function isProductSoldOut(productId: string): Promise<boolean> {
  const state = await getSoldOutState();
  return state[productId] === true;
}