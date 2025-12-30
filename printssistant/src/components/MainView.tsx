/**
 * Main analysis view with progress, DPI analysis, and manual checks.
 */

import { useMemo } from 'react';
import { Alert, Badge, Button, Columns, ProgressBar, Rows, Text, Title } from '@canva/app-ui-kit';
import { useIntl } from 'react-intl';
import * as styles from 'styles/components.css';
import type { PrintJob } from '../data/printJobs';
import { getRequiredChecks, getOptionalChecks } from '../data/manualChecks';
import { formatDimensions, formatProgress, dimensionsMatch } from '../lib/formatting';
import { DPIAnalyzer } from './DPIAnalyzer';
import { ManualCheckItem } from './ManualCheckItem';
import { ContextualTips } from './ContextualTips';
import { SuccessState } from './SuccessState';
import type { ImageAnalysisState } from '../hooks/useImageAnalysis';

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
    job.heightIn
  );
  const sizeMatchesRotated = dimensionsMatch(
    designWidthIn,
    designHeightIn,
    job.heightIn,
    job.widthIn
  );

  // Show success state when all required checks complete
  if (allRequiredComplete) {
    return (
      <div className={styles.scrollContainer}>
        <SuccessState job={job} onStartOver={onStartOver} />
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
              defaultMessage: '← Change',
              description: 'Change job button',
            })}
          </Button>
          <Badge
            ariaLabel={intl.formatMessage({
              defaultMessage: 'Selected job',
              description: 'Job badge label',
            })}
            tone="info"
            text={job.name}
          />
        </Columns>

        {/* Size mismatch warning */}
        {!sizeMatches && !sizeMatchesRotated && (
          <Alert tone="warn">
            <Text size="small">
              {intl.formatMessage(
                {
                  defaultMessage:
                    "Design size ({designSize}) doesn't match {jobName} ({jobSize}). Your print may be cropped or scaled.",
                  description: 'Size mismatch warning',
                },
                {
                  designSize: formatDimensions(designWidthIn, designHeightIn),
                  jobName: job.name,
                  jobSize: formatDimensions(job.widthIn, job.heightIn),
                }
              )}
            </Text>
          </Alert>
        )}

        {/* Progress bar */}
        <Rows spacing="0.5u">
          <Columns spacing="1u" alignY="center">
            <Text size="small">
              {intl.formatMessage({
                defaultMessage: 'Progress',
                description: 'Progress label',
              })}
            </Text>
            <Text size="small" tone="tertiary">
              {`${requiredCompleted}/${requiredChecks.length} `}
              {intl.formatMessage({
                defaultMessage: 'required',
                description: 'Required label',
              })}
            </Text>
          </Columns>
          <ProgressBar
            value={progress}
            ariaLabel={intl.formatMessage({
              defaultMessage: 'Preflight progress',
              description: 'Progress bar label',
            })}
          />
        </Rows>

        {/* DPI Analysis section */}
        <DPIAnalyzer job={job} analysis={imageAnalysis} />

        {/* Required checks */}
        <Rows spacing="1u">
          <Text>
            <strong>
              {intl.formatMessage({
                defaultMessage: 'Required Checks',
                description: 'Required checks heading',
              })}
            </strong>
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

        {/* Optional checks */}
        <Rows spacing="1u">
          <Text>
            <strong>
              {intl.formatMessage({
                defaultMessage: 'Optional Checks',
                description: 'Optional checks heading',
              })}
            </strong>
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

        {/* Contextual tips */}
        <ContextualTips job={job} />
      </Rows>
    </div>
  );
}
