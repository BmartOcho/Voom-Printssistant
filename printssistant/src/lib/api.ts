/**
 * API utilities for backend integration.
 * Works offline when CANVA_BACKEND_HOST is not configured.
 */

// Backend host from environment variable
const BACKEND_HOST =
  typeof process !== "undefined" ? process.env.CANVA_BACKEND_HOST || "" : "";

/**
 * Check if backend is available.
 */
export function isBackendEnabled(): boolean {
  return Boolean(BACKEND_HOST);
}

/**
 * Product rule from backend.
 */
export interface ProductRule {
  sku: string;
  trimWidthIn: number;
  trimHeightIn: number;
  bleedIn: number;
  safeMarginIn: number;
  allowMultiPage: boolean;
  notes?: string;
  export: {
    acceptedFileTypes: ("pdf_standard" | "png" | "jpg")[];
    recommended: "pdf_standard";
    instructions: string;
  };
}

/**
 * Job from backend.
 */
export interface Job {
  id: string;
  sku: string;
  quantity: number;
  status: "artwork_pending" | "artwork_ready";
  exports: ExportRecord[];
  createdAt: string;
}

/**
 * Export record.
 */
export interface ExportRecord {
  id: string;
  sku: string;
  jobId?: string;
  customerGroup?: string;
  designTitle?: string;
  exportUrl: string;
  canvaDesignId?: string;
  returnUrl?: string;
  createdAt: string;
  filePath?: string;
}

/**
 * Export payload for creating new exports.
 */
export interface ExportPayload {
  sku: string;
  jobId?: string;
  customerGroup?: string;
  designTitle?: string;
  exportUrl: string;
  canvaDesignId?: string;
  returnUrl?: string;
  raw?: unknown;
}

/**
 * Fetch product rule from backend.
 * Returns null if backend is unavailable.
 */
export async function fetchRule(sku: string): Promise<ProductRule | null> {
  if (!isBackendEnabled()) {
    // console.log("[API] Backend not configured, skipping fetchRule");
    return null;
  }

  try {
    const res = await fetch(
      `${BACKEND_HOST}/api/rules?sku=${encodeURIComponent(sku)}`,
    );
    if (!res.ok) {
      // console.warn(`[API] Failed to fetch rules for ${sku}: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch {
    // console.error("[API] fetchRule error:", error);
    return null;
  }
}

/**
 * Get job by ID.
 * Returns null if backend is unavailable.
 */
export async function getJob(id: string): Promise<Job | null> {
  if (!isBackendEnabled()) {
    // console.log("[API] Backend not configured, skipping getJob");
    return null;
  }

  try {
    const res = await fetch(
      `${BACKEND_HOST}/api/jobs/${encodeURIComponent(id)}`,
    );
    if (!res.ok) {
      if (res.status === 404) {
        // console.warn(`[API] Job ${id} not found`);
        return null;
      }
      throw new Error(`Failed to fetch job ${id}`);
    }
    return await res.json();
  } catch {
    // console.error("[API] getJob error:", error);
    return null;
  }
}

/**
 * Create a new job.
 * Returns null if backend is unavailable.
 */
export async function createJob(
  sku: string,
  quantity = 1,
): Promise<Job | null> {
  if (!isBackendEnabled()) {
    // console.log("[API] Backend not configured, skipping createJob");
    return null;
  }

  try {
    const res = await fetch(`${BACKEND_HOST}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, quantity }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to create job: ${txt}`);
    }
    const json = await res.json();
    return json.job || json;
  } catch {
    // console.error("[API] createJob error:", error);
    return null;
  }
}

/**
 * Post an export to the backend.
 * Returns null if backend is unavailable.
 */
export async function postExport(
  payload: ExportPayload,
): Promise<{ ok: boolean; record: ExportRecord } | null> {
  if (!isBackendEnabled()) {
    // console.log("[API] Backend not configured, skipping postExport");
    return null;
  }

  try {
    const res = await fetch(`${BACKEND_HOST}/api/exports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Export POST failed: ${txt}`);
    }
    return await res.json();
  } catch {
    // console.error("[API] postExport error:", error);
    return null;
  }
}
