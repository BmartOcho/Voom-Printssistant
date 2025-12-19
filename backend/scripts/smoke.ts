import { ProductRuleSchema, ExportPayloadSchema } from "@printssistant/shared";

async function smoke() {
  console.log("💨 Starting smoke test...");

  const BASE_URL = "http://localhost:8787";

  // 1. Fetch Rule
  console.log("👉 Fetching rules for POSTCARD_4x6...");
  try {
    const res = await fetch(`${BASE_URL}/api/rules?sku=POSTCARD_4x6`);
    if (!res.ok) throw new Error(`Failed to fetch rules: ${res.status} ${res.statusText}`);
    
    const json = await res.json();
    const rule = ProductRuleSchema.parse(json);
    console.log("✅ Rule retrieved and validated:", rule.sku);
  } catch (e) {
    console.error("❌ Rule validation failed:", e);
    process.exit(1);
  }

  // 2. Post Export
  console.log("👉 Posting export...");
  try {
    const payload = {
      sku: "POSTCARD_4x6",
      jobId: "SMOKE_123",
      exportUrl: "https://example.com/smoke-test.pdf"
    };
    
    // Validate payload client-side before sending (mimicking app)
    ExportPayloadSchema.parse(payload);

    const res = await fetch(`${BASE_URL}/api/exports`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Export failed: ${res.status} - ${txt}`);
    }

    const json = await res.json();
    if (!json.ok) throw new Error("Export response not ok");
    console.log("✅ Export posted successfully:", json.record.id);

  } catch (e) {
    console.error("❌ Export failed:", e);
    process.exit(1);
  }

  console.log("✨ All smoke tests passed!");
}

smoke();
