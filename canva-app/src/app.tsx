import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Rows,
  Text,
  Title,
  Box
} from "@canva/app-ui-kit";

import { requestExport } from "@canva/design";
import { useFeatureSupport } from "@canva/app-hooks";

import { fetchRule, postExport, getJob, createJob, ProductRule, Job } from "./lib/api";
import { getQueryParamOr, getQueryParam } from "./lib/query";

type Readiness = {
  ok: boolean;
  issues: string[];
};

function inches(n: number) {
  // nice display formatting
  return Number.isInteger(n) ? `${n}"` : `${n.toFixed(3)}"`;
}

export function App() {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

  // These are passed in via your deep link (or appended by your website)
  const sku = useMemo(() => getQueryParamOr("sku", "POSTCARD_4x6"), []);
  const initialJobId = useMemo(() => getQueryParam("job_id") ?? undefined, []);
  const customerGroup = useMemo(() => getQueryParam("group") ?? "default", []);
  const returnUrl = useMemo(() => getQueryParam("return_url") ?? undefined, []);

  const [currentJobId, setCurrentJobId] = useState<string | undefined>(initialJobId);
  const [job, setJob] = useState<Job | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);

  const [rule, setRule] = useState<ProductRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportId, setExportId] = useState<string | null>(null);

  const isSupported = useFeatureSupport();

  // Load Rules
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await fetchRule(sku);
        setRule(r);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load product rules");
      } finally {
        setLoading(false);
      }
    })();
  }, [sku]);

  // Load Job
  useEffect(() => {
    if (!currentJobId) {
      setJob(null);
      setJobError(null);
      return;
    }

    // Optimization: if we already have the job data matching this ID, don't re-fetch.
    if (job && job.id === currentJobId) {
      return;
    }

    (async () => {
      try {
        setJobError(null);
        const j = await getJob(currentJobId);
        setJob(j);
      } catch (e: any) {
        setJobError(e?.message ?? "Failed to load job");
        setJob(null);
      }
    })();
  }, [currentJobId, job]);

  const readiness: Readiness = useMemo(() => {
    if (!rule) return { ok: false, issues: ["Rules not loaded yet"] };

    // Phase 1: This is intentionally conservative.
    const issues: string[] = [];

    if (rule.bleedIn <= 0) issues.push("Bleed is not configured for this SKU.");
    if (rule.safeMarginIn <= 0) issues.push("Safe margin is not configured for this SKU.");
    if (rule.trimWidthIn <= 0 || rule.trimHeightIn <= 0) {
      issues.push("Trim size is not configured correctly.");
    }

    return { ok: issues.length === 0, issues };
  }, [rule]);

  async function handleCreateJob() {
    try {
      setStatus("Creating new job...");
      setJobError(null);
      const newJob = await createJob({ sku, quantity: 1 });
      setJob(newJob);
      setCurrentJobId(newJob.id);
      setStatus("Job created.");
    } catch (e: any) {
      setJobError(e?.message ?? "Failed to create job");
      setStatus(null);
    }
  }

  async function handleExport() {
    if (!rule) return;
    if (!job) {
      setError("No active job found. Please create or link a job first.");
      return;
    }

    setStatus(null);
    setError(null);
    setExportId(null);

    // Canva recommends checking feature support before calling SDK methods.
    if (!isSupported(requestExport)) {
      setError("Export is not supported in this Canva context.");
      return;
    }

    try {
      setStatus("Opening export dialog…");

      // This opens Canva’s export dialog and returns URLs for the exported file(s).
      const result = await requestExport({
        acceptedFileTypes: rule.export.acceptedFileTypes
      });

      // Docs show status can be "completed" or "aborted".
      if ((result as any).status === "aborted") {
        setStatus("Export cancelled.");
        return;
      }

      const completed = result as any;
      const blobs: Array<{ url: string }> = completed.exportBlobs ?? [];
      const firstUrl = blobs[0]?.url;

      if (!firstUrl) {
        setError("Export succeeded but no export URL was returned.");
        return;
      }

      setExportUrl(firstUrl);
      setStatus("Export completed. Logging export to your print shop backend…");

      const response = await postExport({
        sku,
        jobId: job.id,
        customerGroup,
        designTitle: completed.title,
        exportUrl: firstUrl,
        returnUrl,
        raw: completed
      });

      setExportId(response.record.id);

      setStatus("Logged.");

      // Refresh job data
      const updatedJob = await getJob(job.id);
      setJob(updatedJob);

    } catch (e: any) {
      setError(e?.message ?? "Export failed");
    }
  }

  function handleReturn() {
    if (!returnUrl) {
      setError("No return_url provided.");
      return;
    }
    window.open(returnUrl, "_top");
  }

  if (loading) {
    return (
      <Box padding="2u">
        <Rows spacing="2u">
          <Title>Printssistant</Title>
          <Rows spacing="1u">
            <Text>Loading product rules…</Text>
          </Rows>
        </Rows>
      </Box>
    );
  }

  return (
    <Box padding="2u">
      <Rows spacing="2u">
        <Rows spacing="1u">
          <Title>Printssistant Prepress Helper</Title>
          <Text>
            SKU: <strong>{sku}</strong>
            {currentJobId ? (
              <>
                {" "}
                | Job: <strong>{currentJobId}</strong>
              </>
            ) : null}
            {" "}
            | Group: <strong>{customerGroup}</strong>
          </Text>
          <Text tone={returnUrl ? "positive" : "critical"}>
            Return URL: {returnUrl ? "Present" : "Absent"}
          </Text>
        </Rows>

        {error ? <Alert tone="critical">{error}</Alert> : null}
        {jobError ? <Alert tone="critical">{jobError}</Alert> : null}
        {status ? <Alert tone="info">{status}</Alert> : null}

        {/* Job Binding Section */}
        <Rows spacing="1u">
          <Text><strong>Job Details</strong></Text>
          {job ? (
             <Rows spacing="0.5u">
                <Text>Status: {job.status}</Text>
                <Text>Export Count: {job.exports.length}</Text>
             </Rows>
          ) : (
             <Box>
                <Text>No valid job linked.</Text>
                <Button variant="secondary" onClick={handleCreateJob}>Create New Job</Button>
             </Box>
          )}
        </Rows>

        <Rows spacing="1u">
          <Text>
            <strong>Print specs</strong>
          </Text>
          {rule ? (
            <Rows spacing="0.5u">
              <Text>
                Trim: {inches(rule.trimWidthIn)} × {inches(rule.trimHeightIn)}
              </Text>
              <Text>Bleed: {inches(rule.bleedIn)}</Text>
              <Text>Safe margin: {inches(rule.safeMarginIn)}</Text>
              {rule.notes ? <Text>{rule.notes}</Text> : null}
            </Rows>
          ) : (
            <Text>No rules found for this SKU.</Text>
          )}
        </Rows>

        <Rows spacing="1u">
          <Text>
            <strong>Readiness</strong>{" "}
            {readiness.ok ? " (OK)" : " (Needs attention)"}
          </Text>

          {!readiness.ok ? (
            <Rows spacing="0.5u">
              {readiness.issues.map((i) => (
                <Text key={i}>• {i}</Text>
              ))}
            </Rows>
          ) : (
            <Text>Basic configuration looks good. Next step: export as PDF.</Text>
          )}
        </Rows>

        <Rows spacing="1u">
          <Text>
            <strong>Export</strong>
          </Text>
          {rule ? <Text>{rule.export.instructions}</Text> : null}

          <Button
            variant="primary"
            onClick={handleExport}
            disabled={!rule || !job || !isSupported(requestExport)}
          >
            Export Print-Ready PDF
          </Button>

          {exportId ? (
             <Box>
                <Alert tone="positive">Export successfully captured.</Alert>
                <Box paddingTop="1u">
                  <a
                    href={`${BACKEND_URL}/api/exports/${exportId}/download`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                       display: 'inline-block',
                       padding: '8px 16px',
                       backgroundColor: '#00c4cc',
                       color: 'white',
                       borderRadius: '4px',
                       textDecoration: 'none',
                       fontWeight: 'bold'
                    }}
                  >
                    Download stored PDF
                  </a>
                </Box>
             </Box>
          ) : null}

          {returnUrl ? (
            <Button variant="secondary" onClick={handleReturn}>
              Return to Upload
            </Button>
          ) : null}
        </Rows>
      </Rows>
    </Box>
  );
}
