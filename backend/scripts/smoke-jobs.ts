import { JobCreateSchema, JobSchema, ExportPayloadSchema, ExportRecordSchema } from "@printssistant/shared";

async function smokeJobs() {
  console.log("💨 Starting Jobs smoke test...");

  const BASE_URL = "http://localhost:8787";

  // 1. Create Job
  console.log("👉 Creating Job for POSTCARD_4x6...");
  let jobId: string | undefined;

  try {
    const payload = { sku: "POSTCARD_4x6", quantity: 100 };
    JobCreateSchema.parse(payload);

    const res = await fetch(`${BASE_URL}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Create Job failed: ${res.status}`);
    const json = await res.json();
    // Adjusted for new API response format: { ok: true, job: ... }
    const job = JobSchema.parse(json.job);
    
    console.log("✅ Job created:", job.id);
    jobId = job.id;
  } catch (e) {
    console.error("❌ Job creation failed:", e);
    process.exit(1);
  }

  if (!jobId) process.exit(1);

  // 2. Attach Export to Job
  console.log("👉 Attaching Export to Job...");
  try {
    const payload = {
      sku: "POSTCARD_4x6",
      jobId: jobId,
      exportUrl: "https://pdfobject.com/pdf/sample.pdf"
    };

    const res = await fetch(`${BASE_URL}/api/exports`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    const json = await res.json();
    if (!json.ok) throw new Error("Export ok=false");
    
    console.log("✅ Export posted for job.");
  } catch (e) {
    console.error("❌ Export attachment failed:", e);
    process.exit(1);
  }

  // 3. Verify Job Status
  console.log("👉 Verifying Job Status...");
  try {
    const res = await fetch(`${BASE_URL}/api/jobs/${jobId}`);
    if (!res.ok) throw new Error(`Get Job failed: ${res.status}`);
    
    const json = await res.json();
    const job = JobSchema.parse(json);

    if (job.status !== "artwork_ready") {
       throw new Error(`Expected status 'artwork_ready', got '${job.status}'`);
    }

    if (job.exports.length !== 1) {
       throw new Error(`Expected 1 export, got ${job.exports.length}`);
    }

    console.log("✅ Job status verified as artwork_ready with 1 export.");

  } catch (e) {
    console.error("❌ Job verification failed:", e);
    process.exit(1);
  }

  console.log("✨ All Job smoke tests passed!");
}

smokeJobs();
