/**
 * Success state displayed when all required checks are complete.
 * Includes visual confirmation, export button, and next steps.
 */

import { Alert, Button, Rows, Text, Title } from '@canva/app-ui-kit';
import { useIntl } from 'react-intl';
import type { PrintJob } from '../data/printJobs';
import { formatDimensions } from '../lib/formatting';
import { ExportButton } from './ExportButton';

interface SuccessStateProps {
  job: PrintJob;
  completedChecks: string[];
  onStartOver: () => void;
}

export function SuccessState({ job, completedChecks, onStartOver }: SuccessStateProps) {
  const intl = useIntl();

  return (
    <Rows spacing="2u">
      {/* Celebration header */}
      <Rows spacing="1u" align="center">
        <div style={{ fontSize: '48px', textAlign: 'center' }}>
          <span role="img" aria-label="Celebration">🎉</span>
        </div>

        <Title size="large" alignment="center">
          {intl.formatMessage({
            defaultMessage: 'Ready for Print!',
            description: 'Success title',
          })}
        </Title>
      </Rows>

      {/* Confirmation banner */}
      <Alert tone="positive">
        <Rows spacing="0.5u">
          <Text size="small">
            <strong>
              {intl.formatMessage({
                defaultMessage: 'All checks passed',
                description: 'Success banner title',
              })}
            </strong>
          </Text>
          <Text size="small">
            {`✓ ${intl.formatMessage({
              defaultMessage: 'Size verified',
              description: 'Size check confirmed',
            })} (${formatDimensions(job.widthIn, job.heightIn)})`}
          </Text>
          <Text size="small">
            {`✓ ${intl.formatMessage({
              defaultMessage: 'Print setup complete',
              description: 'Print setup confirmed',
            })}`}
          </Text>
          <Text size="small">
            {`✓ ${intl.formatMessage(
              {
                defaultMessage: '{count} checks completed',
                description: 'Checks count',
              },
              { count: completedChecks.length }
            )}`}
          </Text>
        </Rows>
      </Alert>

      {/* Export section */}
      <Rows spacing="1u">
        <Text alignment="center">
          <strong>
            {intl.formatMessage({
              defaultMessage: 'Get Your Print File',
              description: 'Export section title',
            })}
          </strong>
        </Text>

        <ExportButton job={job} completedChecks={completedChecks} />
      </Rows>

      {/* Print specifications summary */}
      <Rows spacing="0.5u">
        <Text size="small" tone="tertiary">
          {intl.formatMessage({
            defaultMessage: 'Print Specifications:',
            description: 'Specs heading',
          })}
        </Text>
        <Text size="small" tone="secondary">
          {intl.formatMessage(
            {
              defaultMessage: 'Trim Size: {dimensions}',
              description: 'Trim size spec',
            },
            { dimensions: formatDimensions(job.widthIn, job.heightIn) }
          )}
        </Text>
        {job.bleedIn > 0 && (
          <Text size="small" tone="secondary">
            {intl.formatMessage(
              {
                defaultMessage: 'Bleed: {bleed}"',
                description: 'Bleed spec',
              },
              { bleed: job.bleedIn }
            )}
          </Text>
        )}
        {job.safeMarginIn > 0 && (
          <Text size="small" tone="secondary">
            {intl.formatMessage(
              {
                defaultMessage: 'Safe Zone: {safe}" from edge',
                description: 'Safe zone spec',
              },
              { safe: job.safeMarginIn }
            )}
          </Text>
        )}
      </Rows>

      {/* Start over option */}
      <Button variant="tertiary" onClick={onStartOver}>
        {intl.formatMessage({
          defaultMessage: 'Start Over with Different Job',
          description: 'Reset button',
        })}
      </Button>
    </Rows>
  );
}
