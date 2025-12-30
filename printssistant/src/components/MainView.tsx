/**
 * Main analysis view with progress, DPI analysis, and manual checks.
 * Features progressive disclosure and user-friendly language.
 */

import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Columns,
  ProgressBar,
  Rows,
  Text,
} from "@canva/app-ui-kit";
import { useIntl } from "react-intl";
import * as styles from "styles/components.css";
import type { PrintJob } from "../data/printJobs";
import { getRequiredChecks, getOptionalChecks } from "../data/manualChecks";
import {
  formatDimensions,
  formatProgress,
  dimensionsMatch,
} from "../lib/formatting";
import { DPIAnalyzer } from "./DPIAnalyzer";
import { ManualCheckItem } from "./ManualCheckItem";
import { ContextualTips } from "./ContextualTips";
import { SuccessState } from "./SuccessState";
import type { ImageAnalysisState } from "../hooks/useImageAnalysis";

const CHECKMARK = "\u2713";
const SPACE = " ";

interface MainViewProps {
  job: PrintJob;
  designWidthIn: number;
  designHeightIn: number;
  completedChecks: string[];
  onToggleCheck: (id: string) => void;
  onChangeJob: () => void;
  onStartOver: () => void;
  imageAnalysis: ImageAnalysisState;
}

export function MainView({
  job,
  designWidthIn,
  designHeightIn,
  completedChecks,
  onToggleCheck,
  onChangeJob,
  onStartOver,
  imageAnalysis,
}: MainViewProps) {
  const intl = useIntl();
  const requiredChecks = getRequiredChecks();
  const optionalChecks = getOptionalChecks();

  // State for progressive disclosure
  const [showOptionalChecks, setShowOptionalChecks] = useState(false);

  // Calculate progress based on required checks
  const requiredCompleted = useMemo(() => {
    return requiredChecks.filter((c) => completedChecks.includes(c.id)).length;
  }, [requiredChecks, completedChecks]);

  const progress = formatProgress(requiredCompleted, requiredChecks.length);
  const allRequiredComplete = requiredCompleted === requiredChecks.length;

  // Check if design size matches job
  const sizeMatches = dimensionsMatch(
    designWidthIn,
    designHeightIn,
    job.widthIn,
    job.heightIn,
  );
  const sizeMatchesRotated = dimensionsMatch(
    designWidthIn,
    designHeightIn,
    job.heightIn,
    job.widthIn,
  );
  const hasProperSize = sizeMatches || sizeMatchesRotated;

  // Show success state when all required checks complete
  if (allRequiredComplete) {
    return (
      <div className={styles.scrollContainer}>
        <SuccessState
          job={job}
          completedChecks={completedChecks}
          onStartOver={onStartOver}
        />
      </div>
    );
  }

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        {/* Header with job badge */}
        <Columns spacing="1u" alignY="center">
          <Button variant="tertiary" onClick={onChangeJob}>
            {intl.formatMessage({
              defaultMessage: "← Change",
              description: "Change job button",
            })}
          </Button>
          <Badge
            ariaLabel={intl.formatMessage({
              defaultMessage: "Selected job",
              description: "Job badge label",
            })}
            tone="info"
            text={job.name}
          />
        </Columns>

        {/* Size mismatch warning - friendly language */}
        {!hasProperSize && (
          <Alert tone="warn">
            <Rows spacing="0.5u">
              <Text size="small">
                <strong>
                  {intl.formatMessage({
                    defaultMessage: "Design size may need adjustment",
                    description: "Size mismatch title",
                  })}
                </strong>
              </Text>
              <Text size="small">
                {intl.formatMessage(
                  {
                    defaultMessage:
                      "Your design is {designSize}, but {jobName} requires {jobSize}. The print may be scaled or cropped.",
                    description: "Size mismatch explanation",
                  },
                  {
                    designSize: formatDimensions(designWidthIn, designHeightIn),
                    jobName: job.name,
                    jobSize: formatDimensions(job.widthIn, job.heightIn),
                  },
                )}
              </Text>
              <Button variant="tertiary" onClick={onChangeJob}>
                {intl.formatMessage({
                  defaultMessage: "Choose a different size",
                  description: "Change size suggestion",
                })}
              </Button>
            </Rows>
          </Alert>
        )}


        {/* Size match confirmation */}
        {hasProperSize && (
          <Alert tone="positive">
            <Text size="small">
              <span aria-hidden="true">{CHECKMARK}</span>
              {SPACE}
              {intl.formatMessage({
                defaultMessage: "Design size matches",
                description: "Size match confirmation",
              })}
              {SPACE}
              {formatDimensions(job.widthIn, job.heightIn)}
            </Text>
          </Alert>
        )}

        {/* Progress bar */}
        <Rows spacing="0.5u">
          <Columns spacing="1u" alignY="center">
            <Text size="small">
              {intl.formatMessage({
                defaultMessage: "Getting Print Ready",
                description: "Progress heading",
              })}
            </Text>
            <Text size="small" tone="tertiary">
              {intl.formatMessage(
                {
                  defaultMessage: "{completed}/{total}",
                  description: "Progress count",
                },
                {
                  completed: requiredCompleted,
                  total: requiredChecks.length,
                },
              )}
            </Text>
          </Columns>
          <ProgressBar
            value={progress}
            ariaLabel={intl.formatMessage({
              defaultMessage: "Print preparation progress",
              description: "Progress bar label",
            })}
          />
        </Rows>

        {/* DPI Analysis section */}
        <DPIAnalyzer job={job} analysis={imageAnalysis} />

        {/* Required checks - friendly titles */}
        <Rows spacing="1u">
          <Text>
            <strong>
              {intl.formatMessage({
                defaultMessage: "Quick Checks",
                description: "Required checks heading - friendly",
              })}
            </strong>
          </Text>
          <Text size="small" tone="tertiary">
            {intl.formatMessage({
              defaultMessage:
                "Complete these to ensure your design prints correctly.",
              description: "Required checks description",
            })}
          </Text>
          {requiredChecks.map((check) => (
            <ManualCheckItem
              key={check.id}
              check={check}
              completed={completedChecks.includes(check.id)}
              onToggle={onToggleCheck}
            />
          ))}
        </Rows>

        {/* Optional checks - collapsed by default */}
        <Rows spacing="1u">
          <Button
            variant="tertiary"
            onClick={() => setShowOptionalChecks(!showOptionalChecks)}
          >
            {showOptionalChecks
              ? intl.formatMessage({
                  defaultMessage: "Hide recommended checks",
                  description: "Collapse optional checks",
                })
              : intl.formatMessage(
                  {
                    defaultMessage: "Show recommended checks ({count})",
                    description: "Expand optional checks",
                  },
                  { count: optionalChecks.length },
                )}
          </Button>

          {showOptionalChecks && (
            <Rows spacing="1u">
              <Text size="small" tone="tertiary">
                {intl.formatMessage({
                  defaultMessage:
                    "These are optional but help ensure the best results.",
                  description: "Optional checks description",
                })}
              </Text>
              {optionalChecks.map((check) => (
                <ManualCheckItem
                  key={check.id}
                  check={check}
                  completed={completedChecks.includes(check.id)}
                  onToggle={onToggleCheck}
                />
              ))}
            </Rows>
          )}
        </Rows>

        {/* Contextual tips */}
        <ContextualTips job={job} />
      </Rows>
    </div>
  );
}
