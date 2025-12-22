import { 
  ProductRule, 
  ProductRuleSchema, 
  ExportPayload, 
  ExportRecordSchema, 
  Job, 
  JobSchema, 
  JobCreate 
} from "@printssistant/shared";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

export type { ProductRule, Job };

export async function fetchRule(sku: string): Promise<ProductRule> {
  const res = await fetch(`${BACKEND_URL}/api/rules?sku=${encodeURIComponent(sku)}`);
  if (!res.ok) throw new Error(`Failed to fetch rules for ${sku}`);
  
  const json = await res.json();
  return ProductRuleSchema.parse(json);
}

export async function getJob(id: string): Promise<Job> {
  const res = await fetch(`${BACKEND_URL}/api/jobs/${encodeURIComponent(id)}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Job not found");
    throw new Error(`Failed to fetch job ${id}`);
  }
  const json = await res.json();
  return JobSchema.parse(json);
}

export async function createJob(sku: string, quantity: number = 1): Promise<Job> {
  const payload: JobCreate = { sku, quantity };
  const res = await fetch(`${BACKEND_URL}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to create job: ${txt}`);
  }
  const json = await res.json();
  // The backend returns { ok: true, job: ... } in the specific implementation requested earlier
  if (json.ok && json.job) {
    return JobSchema.parse(json.job);
  }
  // Fallback if the backend returned naked job object (just in case)
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
  const record = ExportRecordSchema.parse(json.record);
  return { ...json, record };
}
