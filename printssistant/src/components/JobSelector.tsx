/**
 * Job selector view showing print job presets and current design size.
 */

import { useState } from "react";
import {
  Alert,
  Button,
  Columns,
  NumberInput,
  Rows,
  Text,
  Title,
} from "@canva/app-ui-kit";
import { useIntl } from "react-intl";
import * as styles from "styles/components.css";
import type { PrintJob } from "../data/printJobs";
import { getJobsByCategory, getCategoryLabel, createCustomJob } from "../data/printJobs";
import { formatDimensions, dimensionsMatch } from "../lib/formatting";

const MULTIPLY_SYMBOL = "×";

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
  
  // Custom size state
  const [customWidth, setCustomWidth] = useState<string>("");
  const [customHeight, setCustomHeight] = useState<string>("");

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

  // Handle custom size selection
  const handleCustomSizeSelect = () => {
    const width = parseFloat(customWidth);
    const height = parseFloat(customHeight);
    
    if (!isNaN(width) && width > 0 && !isNaN(height) && height > 0) {
      const customJob = createCustomJob(width, height);
      onSelectJob(customJob);
    }
  };

  // Check if custom size inputs are valid
  const isCustomSizeValid = () => {
    const width = parseFloat(customWidth);
    const height = parseFloat(customHeight);
    return !isNaN(width) && width > 0 && !isNaN(height) && height > 0;
  };

  // Get match status for custom size
  const getCustomSizeMatchStatus = (): "match" | "rotated" | "mismatch" | null => {
    if (!isCustomSizeValid()) return null;
    
    const width = parseFloat(customWidth);
    const height = parseFloat(customHeight);
    
    if (dimensionsMatch(designWidthIn, designHeightIn, width, height)) {
      return "match";
    }
    if (dimensionsMatch(designWidthIn, designHeightIn, height, width)) {
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

        {/* Custom size input section */}
        <Rows spacing="1u">
          <Text size="small" tone="tertiary">
            {intl.formatMessage({
              defaultMessage: "Custom Size",
              description: "Custom size section label",
            })}
          </Text>
          
          <Columns spacing="1u" alignY="end">
            <NumberInput
              value={customWidth}
              onChange={(_num, str) => setCustomWidth(str)}
              placeholder={intl.formatMessage({
                defaultMessage: "Width (in)",
                description: "Custom width placeholder",
              })}
              min={0.1}
              step={0.125}
            />
            <Text>
              <span aria-hidden="true">{MULTIPLY_SYMBOL}</span>
            </Text>
            <NumberInput
              value={customHeight}
              onChange={(_num, str) => setCustomHeight(str)}
              placeholder={intl.formatMessage({
                defaultMessage: "Height (in)",
                description: "Custom height placeholder",
              })}
              min={0.1}
              step={0.125}
            />
            <Button
              variant={getCustomSizeMatchStatus() === "match" || getCustomSizeMatchStatus() === "rotated" ? "primary" : "secondary"}
              onClick={handleCustomSizeSelect}
              disabled={!isCustomSizeValid()}
            >
              {intl.formatMessage(
                {
                  defaultMessage: "Use Custom Size{status}",
                  description: "Custom size submit button",
                },
                {
                  status: getCustomSizeMatchStatus() === "match" 
                    ? " ✓" 
                    : getCustomSizeMatchStatus() === "rotated" 
                    ? " ↻" 
                    : "",
                }
              )}
            </Button>
          </Columns>

          {isCustomSizeValid() && getCustomSizeMatchStatus() === "mismatch" && (
            <Alert tone="warn">
              <Text size="small">
                {intl.formatMessage({
                  defaultMessage: "Custom size doesn't match your current design dimensions.",
                  description: "Custom size mismatch warning",
                })}
              </Text>
            </Alert>
          )}
        </Rows>

        {/* Job categories */}
        <Text size="small" tone="tertiary">
          {intl.formatMessage({
            defaultMessage: "Or choose a preset:",
            description: "Preset section divider",
          })}
        </Text>

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
