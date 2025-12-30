/**
 * Success state displayed when all required checks are complete.
 * Includes visual confirmation, bleed status, and export options.
 */

import { Alert, Button, Rows, Text, Title } from "@canva/app-ui-kit";
import { useIntl } from "react-intl";
import type { PrintJob } from "../data/printJobs";
import { formatDimensions } from "../lib/formatting";
import { ExportButton } from "./ExportButton";

interface SuccessStateProps {
  job: PrintJob;
  completedChecks: string[];
  onStartOver: () => void;
}

export function SuccessState({
  job,
  completedChecks,
  onStartOver,
}: SuccessStateProps) {
  const intl = useIntl();

  // Determine bleed status for display
  const hasBleedRequirement = job.bleedIn > 0;

  return (
    <Rows spacing="2u">
      {/* Celebration header */}
      <Rows spacing="1u" align="center">
        <div
          style={{ fontSize: "48px", textAlign: "center", color: "#00a87e" }}
          aria-hidden="true"
        >
          {intl.formatMessage({
            defaultMessage: "✓",
            description: "Success checkmark - decorative",
          })}
        </div>

        <Title size="large" alignment="center">
          {intl.formatMessage({
            defaultMessage: "Ready for Print!",
            description: "Success title",
          })}
        </Title>
      </Rows>

      {/* Confirmation banner with checklist */}
      <Alert tone="positive">
        <Rows spacing="0.5u">
          <Text size="small">
            <strong>
              {intl.formatMessage({
                defaultMessage: "All checks passed",
                description: "Success banner title",
              })}
            </strong>
          </Text>
          <Text size="small">
            {intl.formatMessage(
              {
                defaultMessage: "✓ Size verified ({dimensions})",
                description: "Size check confirmed with dimensions",
              },
              { dimensions: formatDimensions(job.widthIn, job.heightIn) },
            )}
          </Text>
          <Text size="small">
            {intl.formatMessage({
              defaultMessage: "✓ Print setup complete",
              description: "Print setup confirmed",
            })}
          </Text>
          <Text size="small">
            {intl.formatMessage(
              {
                defaultMessage: "✓ {count} checks completed",
                description: "Checks count",
              },
              { count: completedChecks.length },
            )}
          </Text>
        </Rows>
      </Alert>

      {/* Bleed status */}
      <Rows spacing="0.5u">
        <Text size="small">
          <strong>
            {intl.formatMessage({
              defaultMessage: "Print Specs:",
              description: "Print specs heading",
            })}
          </strong>
        </Text>
        <Text size="small" tone="secondary">
          {intl.formatMessage(
            {
              defaultMessage: "Trim Size: {dimensions}",
              description: "Trim size spec",
            },
            { dimensions: formatDimensions(job.widthIn, job.heightIn) },
          )}
        </Text>
        <Text size="small" tone="secondary">
          {hasBleedRequirement
            ? intl.formatMessage(
                {
                  defaultMessage: 'Bleed: {bleed}"',
                  description: "Bleed spec",
                },
                { bleed: job.bleedIn },
              )
            : intl.formatMessage({
                defaultMessage: "Bleed: Not required for this job",
                description: "No bleed needed",
              })}
        </Text>
        {job.safeMarginIn > 0 && (
          <Text size="small" tone="secondary">
            {intl.formatMessage(
              {
                defaultMessage: 'Safe Zone: {safe}" from edge',
                description: "Safe zone spec",
              },
              { safe: job.safeMarginIn },
            )}
          </Text>
        )}
      </Rows>

      {/* Export section */}
      <Rows spacing="1u">
        <Text alignment="center">
          <strong>
            {intl.formatMessage({
              defaultMessage: "Download Your File",
              description: "Export section title",
            })}
          </strong>
        </Text>

        {/* Bleed status line */}
        <Text
          alignment="center"
          size="small"
          tone={hasBleedRequirement ? undefined : "secondary"}
        >
          {hasBleedRequirement
            ? intl.formatMessage({
                defaultMessage: "Bleed included: Yes",
                description: "Bleed included status",
              })
            : intl.formatMessage({
                defaultMessage: "Bleed included: No (not required)",
                description: "Bleed not included status",
              })}
        </Text>

        <ExportButton job={job} completedChecks={completedChecks} />
      </Rows>

      {/* Start over option */}
      <Button variant="tertiary" onClick={onStartOver}>
        {intl.formatMessage({
          defaultMessage: "Start Over with Different Job",
          description: "Reset button",
        })}
      </Button>
    </Rows>
  );
}
