import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Rows,
  Text,
  Title,
  Box,
} from "@canva/app-ui-kit";

import { requestExport } from "@canva/design";
import { requestOpenExternalUrl } from "@canva/platform";
import { useFeatureSupport } from "@canva/app-hooks";

import { fetchRule, postExport, ProductRule, getJob, createJob, Job } from "./lib/api";
import { getQueryParamOr, getQueryParam } from "./lib/query";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

type Readiness = {
  ok: boolean;
  issues: string[];
};

function inches(n: number) {
  return Number.isInteger(n) ? `${n}"` : `${n.toFixed(3)}"`;
}

export function App() {
  const sku = useMemo(() => getQueryParamOr("sku", "POSTCARD_4x6"), []);
  const initialJobId = useMemo(() => getQueryParam("job_id") ?? undefined, []);
  const customerGroup = useMemo(() => getQueryParam("group") ?? "default", []);
  const returnUrl = useMemo(() => getQueryParam("return_url") ?? undefined, []);

  const [rule, setRule] = useState<ProductRule | null>(null);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportId, setExportId] = useState<string | null>(null);

  const isSupported = useFeatureSupport();

  // Load Rule and Job
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [r] = await Promise.all([
          fetchRule(sku),
          initialJobId ? getJob(initialJobId).then(setCurrentJob).catch((e) => {
            console.error("Job load error:", e);
            setError(`Job ${initialJobId} not found. Please create a new job.`);
          }) : Promise.resolve()
        ]);
        
        setRule(r);
      } catch (e: any) {
        setError(e?.message ?? "Failed to initialize application");
      } finally {
        setLoading(false);
      }
    })();
  }, [sku, initialJobId]);

  const readiness: Readiness = useMemo(() => {
    if (!rule) return { ok: false, issues: ["Rules not loaded yet"] };
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
      setLoading(true);
      setError(null);
      const job = await createJob(sku, 1);
      setCurrentJob(job);
      setStatus(`Job ${job.id} created.`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create job");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!rule || !currentJob) return;

    setStatus(null);
    setError(null);

    if (!isSupported(requestExport)) {
      setError("Export is not supported in this Canva context.");
      return;
    }

    try {
      setStatus("Opening export dialog…");

      const result = await requestExport({
        acceptedFileTypes: rule.export.acceptedFileTypes
      });

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

      setStatus("Export completed. Syncing with backend…");

      const { record } = await postExport({
        sku,
        jobId: currentJob.id,
        customerGroup,
        designTitle: completed.title,
        exportUrl: firstUrl,
        returnUrl,
        raw: completed
      });

      setExportId(record.id);
      setStatus("Export successful and tied to job.");
      
      // Refetch job to get updated exports count and status
      const updatedJob = await getJob(currentJob.id);
      setCurrentJob(updatedJob);

    } catch (e: any) {
      setError(e?.message ?? "Export failed");
    }
  }

  function handleReturn() {
    if (returnUrl) {
      window.open(returnUrl, "_top");
    }
  }

  if (loading) {
    return (
      <Box padding="2u">
        <Rows spacing="2u">
          <Title>Printssistant</Title>
          <Text>Loading application data…</Text>
        </Rows>
      </Box>
    );
  }

  return (
    <Box padding="2u">
      <Rows spacing="2u">
        <Rows spacing="1u">
          <Title>Printssistant</Title>
          <Box border="standard" padding="1u" borderRadius="standard">
             <Text size="small">
               <strong>Debug Status:</strong>
               <br/>SKU: {sku}
               <br/>Job ID: {currentJob?.id ?? (initialJobId ? `${initialJobId} (Invalid)` : "Missing")}
               <br/>Return URL: {returnUrl ? "Present" : "Absent"}
             </Text>
          </Box>
        </Rows>

        {error ? <Alert tone="critical">{error}</Alert> : null}
        {status ? <Alert tone="info">{status}</Alert> : null}

        <Rows spacing="1u">
          <Text><strong>1. Job Binding</strong></Text>
          {currentJob ? (
            <Alert tone="positive">
              Connected to Job: <strong>{currentJob.id}</strong>
              <br/>Status: {currentJob.status}
              <br/>Exports: {currentJob.exports.length}
            </Alert>
          ) : (
            <Rows spacing="1u">
              <Alert tone="critical">No active job found.</Alert>
              <Button variant="primary" onClick={handleCreateJob}>Create New Job</Button>
            </Rows>
          )}
        </Rows>

        <Rows spacing="1u">
          <Text><strong>2. Print Specs</strong></Text>
          {rule ? (
            <Rows spacing="0.5u">
              <Text>Trim: {inches(rule.trimWidthIn)} × {inches(rule.trimHeightIn)}</Text>
              <Text>Bleed: {inches(rule.bleedIn)}</Text>
              <Text>Safe margin: {inches(rule.safeMarginIn)}</Text>
              {rule.notes ? <Text>{rule.notes}</Text> : null}
            </Rows>
          ) : (
            <Text tone="critical">No rules found for SKU: {sku}</Text>
          )}
        </Rows>

        <Rows spacing="1u">
          <Text><strong>3. Readiness</strong></Text>
          {!readiness.ok ? (
            <Rows spacing="0.5u">
              {readiness.issues.map((i) => <Text key={i} tone="critical">• {i}</Text>)}
            </Rows>
          ) : (
            <Text>Configuration matches SKU requirements.</Text>
          )}
        </Rows>

        <Rows spacing="1u">
          <Text><strong>4. Export</strong></Text>
          {rule ? <Text size="small">{rule.export.instructions}</Text> : null}

          <Button
            variant="primary"
            onClick={handleExport}
            disabled={!rule || !currentJob || !readiness.ok || !isSupported(requestExport)}
          >
            Export Print-Ready PDF
          </Button>

          {exportId && (
            <Alert tone="positive">
              <Rows spacing="0.5u">
                <Text>Export successful! ID: {exportId}</Text>
                <Button 
                  variant="secondary" 
                  onClick={() => requestOpenExternalUrl({ url: `${BACKEND_URL}/api/exports/${exportId}/download` })}
                >
                  Download stored PDF
                </Button>
              </Rows>
            </Alert>
          )}

          <Button variant="secondary" onClick={handleReturn} disabled={!returnUrl}>
            Return to Upload
          </Button>
        </Rows>
      </Rows>
    </Box>
  );
}
