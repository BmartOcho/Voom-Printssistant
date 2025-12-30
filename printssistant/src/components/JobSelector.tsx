/**
 * Job selector view showing print job presets and current design size.
 */

import {
  Alert,
  Button,
  Columns,
  Rows,
  Text,
  Title,
} from "@canva/app-ui-kit";
import { useIntl } from "react-intl";
import * as styles from "styles/components.css";
import type { PrintJob } from "../data/printJobs";
import { getJobsByCategory, getCategoryLabel } from "../data/printJobs";
import { formatDimensions, dimensionsMatch } from "../lib/formatting";

interface JobSelectorProps {
  designWidthIn: number;
  designHeightIn: number;
  loading: boolean;
  onSelectJob: (job: PrintJob) => void;
  onBack: () => void;
  onRefresh: () => void;
}

export function JobSelector({
  designWidthIn,
  designHeightIn,
  loading,
  onSelectJob,
  onBack,
  onRefresh,
}: JobSelectorProps) {
  const intl = useIntl();
  const jobsByCategory = getJobsByCategory();

  // Check for size match with each job
  const getSizeMatchStatus = (
    job: PrintJob,
  ): "match" | "rotated" | "mismatch" => {
    // Check normal orientation
    if (
      dimensionsMatch(designWidthIn, designHeightIn, job.widthIn, job.heightIn)
    ) {
      return "match";
    }
    // Check rotated orientation
    if (
      dimensionsMatch(designWidthIn, designHeightIn, job.heightIn, job.widthIn)
    ) {
      return "rotated";
    }
    return "mismatch";
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        {/* Header */}
        <Columns spacing="1u" alignY="center">
          <Button variant="tertiary" onClick={onBack}>
            {intl.formatMessage({
              defaultMessage: "← Back",
              description: "Back button",
            })}
          </Button>
          <Title size="medium">
            {intl.formatMessage({
              defaultMessage: "Select Print Job",
              description: "Job selector title",
            })}
          </Title>
        </Columns>

        {/* Current design size */}
        <Alert tone="info">
          <Rows spacing="0.5u">
            <Text size="small">
              <strong>
                {intl.formatMessage({
                  defaultMessage: "Current Design Size:",
                  description: "Design size label",
                })}
              </strong>
            </Text>
            {loading ? (
              <Text>
                {intl.formatMessage({
                  defaultMessage: "Loading...",
                  description: "Loading state",
                })}
              </Text>
            ) : (
              <Columns spacing="1u" alignY="center">
                <Text>{formatDimensions(designWidthIn, designHeightIn)}</Text>
                <Button variant="tertiary" onClick={onRefresh}>
                  {intl.formatMessage({
                    defaultMessage: "↻ Refresh",
                    description: "Refresh dimensions button",
                  })}
                </Button>
              </Columns>
            )}
          </Rows>
        </Alert>

        {/* Job categories */}
        {Object.entries(jobsByCategory).map(([category, jobs]) => (
          <Rows key={category} spacing="1u">
            <Text size="small" tone="tertiary">
              {getCategoryLabel(category)}
            </Text>

            {jobs.map((job) => {
              const matchStatus = getSizeMatchStatus(job);
              const isMatch =
                matchStatus === "match" || matchStatus === "rotated";

              return (
                <Button
                  key={job.id}
                  variant={isMatch ? "primary" : "secondary"}
                  onClick={() => onSelectJob(job)}
                  stretch
                >
                  {intl.formatMessage(
                    {
                      defaultMessage: "{name} – {dimensions}{status}",
                      description: "Job selector item label",
                    },
                    {
                      name: job.name,
                      dimensions: formatDimensions(job.widthIn, job.heightIn),
                      status:
                        matchStatus === "match"
                          ? " ✓"
                          : matchStatus === "rotated"
                            ? " ↻"
                            : "",
                    },
                  )}
                </Button>
              );
            })}
          </Rows>
        ))}

        {/* Size mismatch warning */}
        <Alert tone="warn">
          <Text size="small">
            {intl.formatMessage({
              defaultMessage:
                "If your design size doesn't match a preset, your print may be cropped or scaled. Consider resizing your design first.",
              description: "Size mismatch warning",
            })}
          </Text>
        </Alert>
      </Rows>
    </div>
  );
}
