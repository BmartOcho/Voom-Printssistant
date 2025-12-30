/**
 * DPI Analyzer component for checking image resolution.
 */

import { Alert, Badge, Button, Rows, Text } from "@canva/app-ui-kit";
import { useIntl } from "react-intl";
import type { PrintJob } from "../data/printJobs";
import { getGuidelineForCategory } from "../data/dpiGuidelines";
import type { ImageAnalysisState } from "../hooks/useImageAnalysis";

interface DPIAnalyzerProps {
  job: PrintJob;
  analysis: ImageAnalysisState;
}

import { defineMessages } from "react-intl";

const messages = defineMessages({
  good: { defaultMessage: "Good", description: "Status badge good" },
  ok: { defaultMessage: "OK", description: "Status badge ok" },
  low: { defaultMessage: "Low", description: "Status badge low" },
  tooLow: { defaultMessage: "Too Low", description: "Status badge too low" },
  unknown: { defaultMessage: "?", description: "Status badge unknown" },
});

export function DPIAnalyzer({ job, analysis }: DPIAnalyzerProps) {
  const intl = useIntl();
  const guideline = getGuidelineForCategory(job.category);

  const handleAnalyze = () => {
    analysis.analyze(job.widthIn, job.heightIn);
  };

  // Get badge tone from overall status
  const getStatusBadge = (): {
    tone: "positive" | "info" | "warn" | "critical";
    text: string;
  } | null => {
    switch (analysis.overallStatus) {
      case "excellent":
      case "good":
        return { tone: "positive", text: intl.formatMessage(messages.good) };
      case "acceptable":
        return { tone: "info", text: intl.formatMessage(messages.ok) };
      case "warning":
        return { tone: "warn", text: intl.formatMessage(messages.low) };
      case "low":
      case "unknown":
        return {
          tone: "critical",
          text:
            analysis.overallStatus === "unknown"
              ? intl.formatMessage(messages.unknown)
              : intl.formatMessage(messages.tooLow),
        };
      default:
        return null;
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <Rows spacing="1u">
      <Rows spacing="0.5u">
        <Text>
          <strong>
            {intl.formatMessage({
              defaultMessage: "Image Resolution (DPI)",
              description: "DPI section title",
            })}
          </strong>
          {statusBadge && (
            <>
              {" "}
              <Badge
                ariaLabel={statusBadge.text}
                tone={statusBadge.tone}
                text={statusBadge.text}
              />
            </>
          )}
        </Text>
        <Text size="small" tone="tertiary">
          {intl.formatMessage(
            {
              defaultMessage: "Recommended: {minDPI}+ DPI for {category}",
              description: "DPI recommendation",
            },
            {
              minDPI: guideline.minRecommendedDPI,
              category: job.category,
            },
          )}
        </Text>
      </Rows>

      {/* Analyze button */}
      <Button
        variant="secondary"
        onClick={handleAnalyze}
        disabled={analysis.loading}
        stretch
      >
        {analysis.loading
          ? intl.formatMessage({
              defaultMessage: "Analyzing...",
              description: "Analyzing state",
            })
          : intl.formatMessage({
              defaultMessage: "Analyze Selected Images",
              description: "Analyze button",
            })}
      </Button>

      {/* Error message */}
      {analysis.error && (
        <Alert tone="warn">
          <Text size="small">{analysis.error}</Text>
        </Alert>
      )}

      {/* Results */}
      {analysis.results.length > 0 && (
        <Rows spacing="0.5u">
          {analysis.results.map((result) => (
            <Alert
              key={result.id}
              tone={result.status ? result.status.color : "info"}
            >
              <Text size="small">
                {result.name}
                {intl.formatMessage({
                  defaultMessage: ": ",
                  description: "Separator",
                })}
                {result.dpi != null && result.status
                  ? intl.formatMessage(
                      {
                        defaultMessage: "{dpi} DPI – {status}",
                        description: "DPI result format",
                      },
                      {
                        dpi: result.dpi,
                        status: intl.formatMessage(result.status.label),
                      },
                    )
                  : result.error ||
                    intl.formatMessage({
                      defaultMessage: "Unable to determine DPI",
                      description: "Unknown DPI message",
                    })}
              </Text>
            </Alert>
          ))}

          <Button variant="tertiary" onClick={analysis.clear}>
            {intl.formatMessage({
              defaultMessage: "Clear Results",
              description: "Clear analysis results",
            })}
          </Button>
        </Rows>
      )}

      {/* Tips */}
      {analysis.overallStatus === "unknown" && (
        <Alert tone="info">
          <Text size="small">
            {intl.formatMessage({
              defaultMessage:
                "If DPI cannot be determined, verify your source images are high resolution before printing.",
              description: "Unknown DPI guidance",
            })}
          </Text>
        </Alert>
      )}
    </Rows>
  );
}
