import { JobCreateSchema, JobSchema, ExportPayloadSchema, ExportRecordSchema } from "@printssistant/shared";

async function verifyIntegration() {
  console.log("🚦 Starting Job/Export Integration Verification...");
  const BASE_URL = "http://localhost:8787";

  // 1. Create Job
  console.log("\n👉 Step 1: Create Job...");
  let jobId: string | undefined;

  try {
    const payload = { sku: "POSTCARD_4x6", quantity: 1 };
    JobCreateSchema.parse(payload); // Client-side validation

    const res = await fetch(`${BASE_URL}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Create Job failed: ${res.status}`);
    const json = await res.json();
    
    // Validate response format { ok: true, job: ... }
    if (!json.ok || !json.job) throw new Error("Invalid job response format");
    
    const job = JobSchema.parse(json.job);
    console.log("✅ Job created:", job.id);
    console.log("   Status:", job.status);
    
    if (job.status !== "artwork_pending") throw new Error("Expected status 'artwork_pending'");
    
    jobId = job.id;
  } catch (e) {
    console.error("❌ Step 1 Failed:", e);
    process.exit(1);
  }

  if (!jobId) process.exit(1);

  // 2. Post Export with Link to Job
  console.log("\n👉 Step 2: Post Export linked to Job...");
  let exportId: string | undefined;

  try {
    const payload = {
      sku: "POSTCARD_4x6",
      jobId: jobId,
      exportUrl: "https://pdfobject.com/pdf/sample.pdf",
      designTitle: "Verification Design"
    };

    const res = await fetch(`${BASE_URL}/api/exports`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Post Export failed: ${res.status}`);
    const json = await res.json();
    if (!json.ok || !json.record) throw new Error("Invalid export response format");

    const rec = ExportRecordSchema.parse(json.record);
    console.log("✅ Export created:", rec.id);
    exportId = rec.id;
  } catch (e) {
    console.error("❌ Step 2 Failed:", e);
    process.exit(1);
  }

  // 3. Verify Job Status and Attachment
  console.log("\n👉 Step 3: Verify Job Status and Export Attachment...");
  try {
    const res = await fetch(`${BASE_URL}/api/jobs/${jobId}`);
    if (!res.ok) throw new Error(`Get Job failed: ${res.status}`);
    
    const job = JobSchema.parse(await res.json());

    console.log("   Current Status:", job.status);
    console.log("   Exports Count:", job.exports.length);

    if (job.status !== "artwork_ready") {
       throw new Error(`Expected status 'artwork_ready', got '${job.status}'`);
    }

    if (job.exports.length !== 1) {
       throw new Error(`Expected 1 export, got ${job.exports.length}`);
    }

    if (job.exports[0].id !== exportId) {
        throw new Error(`Attached export ID mismatch. Expected ${exportId}, got ${job.exports[0].id}`);
    }

    console.log("✅ Job verification passed!");

  } catch (e) {
    console.error("❌ Step 3 Failed:", e);
    process.exit(1);
  }

  console.log("\n✨ SUCCESS: Job and Export integration verified.");
}

verifyIntegration();
