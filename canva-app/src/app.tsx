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

import { fetchRule, postExport, ProductRule } from "./lib/api";
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
  // These are passed in via your deep link (or appended by your website)
  const sku = useMemo(() => getQueryParamOr("sku", "POSTCARD_4x6"), []);
  const jobId = useMemo(() => getQueryParam("job_id") ?? undefined, []);
  const customerGroup = useMemo(() => getQueryParam("group") ?? "default", []);
  const returnUrl = useMemo(() => getQueryParam("return_url") ?? undefined, []);

  const [rule, setRule] = useState<ProductRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const isSupported = useFeatureSupport();

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

  const readiness: Readiness = useMemo(() => {
    if (!rule) return { ok: false, issues: ["Rules not loaded yet"] };

    // Phase 1: This is intentionally conservative.
    // Later you can use Design Editing APIs to inspect the design directly, but this starter keeps it simple.
    const issues: string[] = [];

    if (rule.bleedIn <= 0) issues.push("Bleed is not configured for this SKU.");
    if (rule.safeMarginIn <= 0) issues.push("Safe margin is not configured for this SKU.");
    if (rule.trimWidthIn <= 0 || rule.trimHeightIn <= 0) {
      issues.push("Trim size is not configured correctly.");
    }

    return { ok: issues.length === 0, issues };
  }, [rule]);

  async function handleExport() {
    if (!rule) return;

    setStatus(null);
    setError(null);

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

      await postExport({
        sku,
        jobId,
        customerGroup,
        designTitle: completed.title,
        exportUrl: firstUrl,
        returnUrl,
        raw: completed
      });

      setStatus("Logged. You can now return to upload.");
    } catch (e: any) {
      setError(e?.message ?? "Export failed");
    }
  }

  function handleReturn() {
    if (!returnUrl) {
      setError("No return_url provided. Add return_url to your deep link query params.");
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
            {jobId ? (
              <>
                {" "}
                | Job: <strong>{jobId}</strong>
              </>
            ) : null}
            {" "}
            | Group: <strong>{customerGroup}</strong>
          </Text>
        </Rows>

        {error ? <Alert tone="critical">{error}</Alert> : null}
        {status ? <Alert tone="info">{status}</Alert> : null}



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
            disabled={!rule || !isSupported(requestExport)}
          >
            Export Print-Ready PDF
          </Button>

          {exportUrl ? (
            <Alert tone="positive">
              Export URL captured (valid for a limited time). Your backend logged it.
            </Alert>
          ) : null}

          <Button variant="secondary" onClick={handleReturn} disabled={!returnUrl}>
            Return to Upload
          </Button>

          {!returnUrl ? (
            <Text>
              Tip: pass <code>return_url</code> in your deep link query params so this button works.
            </Text>
          ) : null}
        </Rows>
      </Rows>
    </Box>
  );
}
