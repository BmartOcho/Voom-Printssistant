import {
  ProductRule,
  ProductRuleSchema,
  ExportPayload,
  ExportRecordSchema,
  Job,
  JobSchema,
  JobCreate,
  JobCreateSchema
} from "@printssistant/shared";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

export type { ProductRule, Job, JobCreate };

export async function fetchRule(sku: string): Promise<ProductRule> {
  const res = await fetch(`${BACKEND_URL}/api/rules?sku=${encodeURIComponent(sku)}`);
  if (!res.ok) throw new Error(`Failed to fetch rules for ${sku}`);
  
  const json = await res.json();
  // Validate contract - throws if backend breaks contract
  return ProductRuleSchema.parse(json);
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Job not found");
    }
    throw new Error(`Failed to fetch job: ${res.statusText}`);
  }
  const json = await res.json();
  return JobSchema.parse(json);
}

export async function createJob(data: JobCreate): Promise<Job> {
  const res = await fetch(`${BACKEND_URL}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to create job: ${txt}`);
  }

  const json = await res.json();
  return JobSchema.parse(json);
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
  const json = await res.json();
  // Validate contract - throws if backend response is malformed
  const record = ExportRecordSchema.parse(json.record);
  return { ...json, record };
}
