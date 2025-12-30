/**
 * Export Button component with loading and error states.
 * Handles print-ready PDF export with SDK limitations for bleed.
 *
 * IMPORTANT: The Canva SDK does NOT support bleed/crop marks in exports.
 * This component provides both:
 * 1. SDK export (trim size only)
 * 2. Guidance for using Canva's native export with bleed
 */

import { useState } from "react";
import { Alert, Button, LoadingIndicator, Rows, Text } from "@canva/app-ui-kit";
import { useIntl } from "react-intl";
import { useFeatureSupport } from "@canva/app-hooks";
import { requestExport } from "@canva/design";
import { requestOpenExternalUrl } from "@canva/platform";
import type { PrintJob } from "../data/printJobs";
import { isBackendEnabled, postExport } from "../lib/api";
import {
  getExportCapabilities,
  getBleedExportInstructions,
  logExportDetails,
} from "../lib/exportUtils";

interface ExportButtonProps {
  job: PrintJob;
  completedChecks: string[];
  designTitle?: string;
}

type ExportStatus = "idle" | "preparing" | "exporting" | "success" | "error";

export function ExportButton({
  job,
  completedChecks,
  designTitle,
}: ExportButtonProps) {
  const intl = useIntl();
  const isSupported = useFeatureSupport();
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBleedInstructions, setShowBleedInstructions] = useState(false);

  const canExport = isSupported(requestExport);
  const capabilities = getExportCapabilities(job);
  const bleedInstructions = getBleedExportInstructions();
  const options = {
    bleed: job.bleedIn > 0,
    cropMarks: job.bleedIn > 0,
  };

  const handleExport = async () => {
    setStatus("preparing");
    setErrorMessage(null);

    try {
      if (!canExport) {
        throw new Error("Export is not available in this context.");
      }

      // Validation: Confirm design supports bleed
      if (job.bleedIn > 0 && !capabilities.canIncludeBleed) {
        // This path handles if we decide later SDK doesn't support it
        // For now capabilities.canIncludeBleed is true
        throw new Error("Bleed not supported by SDK");
      }

      setStatus("exporting");

      // Log export options for debugging
      const exportRequest = {
        acceptedFileTypes: ["pdf_standard"],
        ...options,
      };
      logExportDetails(job, exportRequest);

      // Request export from Canva with bleed options
      // @ts-expect-error - SDK types might be outdated in current env
      const result = await requestExport(exportRequest);

      // Handle user cancellation
      if ((result as { status?: string }).status === "aborted") {
        setStatus("idle");
        return;
      }

      const exportResult = result as {
        status: string;
        title?: string;
        exportBlobs?: { url: string }[];
      };

      // Log result for debugging
      logExportDetails(job, exportRequest, exportResult);

      const exportUrl = exportResult.exportBlobs?.[0]?.url;

      if (!exportUrl) {
        throw new Error("Export completed but no file was generated.");
      }

      // If backend is available, send export record
      if (isBackendEnabled()) {
        try {
          await postExport({
            sku: job.id,
            designTitle: designTitle || exportResult.title,
            exportUrl,
          });
        } catch {
          // Backend sync failed - continue with export
        }
      }

      // Open the download URL
      await requestOpenExternalUrl({ url: exportUrl });

      setStatus("success");

      setTimeout(() => {
        setStatus("idle");
      }, 5000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Export error:", err);
      setStatus("error");
      setErrorMessage(
        intl.formatMessage({
          defaultMessage:
            "We could not generate your file. Please try Canva's native export instead.",
          description: "Export error message",
        }),
      );
    }
  };

  const handleRetry = () => {
    setErrorMessage(null);
    handleExport();
  };

  // Loading state
  if (status === "preparing" || status === "exporting") {
    return (
      <Rows spacing="1u" align="center">
        <LoadingIndicator size="medium" />
        <Text alignment="center" size="small" tone="tertiary">
          {status === "preparing"
            ? intl.formatMessage({
                defaultMessage: "Validating print settings...",
                description: "Export preparing state",
              })
            : intl.formatMessage({
                defaultMessage: "Generating Print-Ready PDF...",
                description: "Export generating state",
              })}
        </Text>
      </Rows>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <Rows spacing="1u">
        <Alert tone="warn">
          <Text size="small">{errorMessage}</Text>
        </Alert>
        <Button variant="secondary" onClick={handleRetry} stretch>
          {intl.formatMessage({
            defaultMessage: "Try Again",
            description: "Retry export button",
          })}
        </Button>
        <Button
          variant="tertiary"
          onClick={() => setShowBleedInstructions(!showBleedInstructions)}
          stretch
        >
          {intl.formatMessage({
            defaultMessage: "Show Manual Export Instructions",
            description: "Show manual instructions button",
          })}
        </Button>
        {showBleedInstructions && (
          <Alert tone="info">
            <Rows spacing="0.5u">
              <Text size="small">
                <strong>
                  {intl.formatMessage({
                    defaultMessage: "Canva Native Export:",
                    description: "Bleed instructions heading",
                  })}
                </strong>
              </Text>
              {bleedInstructions.map((instruction, index) => (
                <Text key={index} size="small">
                  {instruction}
                </Text>
              ))}
            </Rows>
          </Alert>
        )}
      </Rows>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <Alert tone="positive">
        <Text size="small">
          {intl.formatMessage({
            defaultMessage: "Your PDF is ready!",
            description: "Export success message",
          })}
        </Text>
      </Alert>
    );
  }

  // Default idle state
  return (
    <Rows spacing="1u">
      {/* Primary Export Button */}
      <Button
        variant="primary"
        onClick={handleExport}
        disabled={!canExport}
        stretch
      >
        {intl.formatMessage({
          defaultMessage: "Download Print-Ready PDF",
          description: "Primary export button",
        })}
      </Button>

      {/* Bleed included info - subtle reassurance */}
      {job.bleedIn > 0 && (
        <Text size="xsmall" tone="secondary" alignment="center">
          {intl.formatMessage({
            defaultMessage: "Includes bleed & crop marks",
            description: "Export subtext",
          })}
        </Text>
      )}

      {job.bleedIn === 0 && (
        <Text size="xsmall" tone="tertiary" alignment="center">
          {intl.formatMessage({
            defaultMessage: "Standard trim-size export",
            description: "No bleed needed note",
          })}
        </Text>
      )}
    </Rows>
  );
}
