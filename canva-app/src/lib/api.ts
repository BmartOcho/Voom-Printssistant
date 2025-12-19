import { ProductRule, ProductRuleSchema, ExportPayload } from "@printssistant/shared";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

export type { ProductRule };

export async function fetchRule(sku: string): Promise<ProductRule> {
  const res = await fetch(`${BACKEND_URL}/api/rules?sku=${encodeURIComponent(sku)}`);
  if (!res.ok) throw new Error(`Failed to fetch rules for ${sku}`);
  
  const json = await res.json();
  // Validate contract - throws if backend breaks contract
  return ProductRuleSchema.parse(json);
}

export async function postExport(payload: ExportPayload) {
  const res = await fetch(`${BACKEND_URL}/api/exports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Export POST failed: ${txt}`);
  }
  return res.json();
}
