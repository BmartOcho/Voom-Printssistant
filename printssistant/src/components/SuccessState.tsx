/**
 * Success state displayed when all required checks are complete.
 */

import { Button, Rows, Text, Title } from '@canva/app-ui-kit';
import { useIntl } from 'react-intl';
import type { PrintJob } from '../data/printJobs';
import { formatDimensions } from '../lib/formatting';

interface SuccessStateProps {
  job: PrintJob;
  onStartOver: () => void;
}

export function SuccessState({ job, onStartOver }: SuccessStateProps) {
  const intl = useIntl();

  return (
    <Rows spacing="2u" align="center">
      {/* Celebration icon */}
      <div style={{ fontSize: '64px', textAlign: 'center' }}>
        <span role="img" aria-label="Celebration">🎉</span>
      </div>

      <Title size="large" alignment="center">
        {intl.formatMessage({
          defaultMessage: 'Ready for Print!',
          description: 'Success title',
        })}
      </Title>

      <Text alignment="center" tone="positive">
        {intl.formatMessage(
          {
            defaultMessage: 'All required checks are complete for {jobName}.',
            description: 'Success message',
          },
          { jobName: job.name }
        )}
      </Text>

      {/* Job summary */}
      <Rows spacing="0.5u" align="center">
        <Text size="small" tone="secondary" alignment="center">
          {intl.formatMessage(
            {
              defaultMessage: 'Size: {dimensions}',
              description: 'Job size',
            },
            { dimensions: formatDimensions(job.widthIn, job.heightIn) }
          )}
        </Text>
        <Text size="small" tone="secondary" alignment="center">
          {intl.formatMessage(
            {
              defaultMessage: 'Bleed: {bleed}" | Safe Zone: {safe}"',
              description: 'Job margins',
            },
            { bleed: job.bleedIn, safe: job.safeMarginIn }
          )}
        </Text>
      </Rows>

      {/* Next steps */}
      <Rows spacing="1u">
        <Text size="small" alignment="center">
          <strong>
            {intl.formatMessage({
              defaultMessage: 'Next Steps:',
              description: 'Next steps heading',
            })}
          </strong>
        </Text>
        <Text size="small" alignment="center">
          {intl.formatMessage({
            defaultMessage: '1. Export your design as a print-ready PDF',
            description: 'Step 1',
          })}
        </Text>
        <Text size="small" alignment="center">
          {intl.formatMessage({
            defaultMessage: '2. Verify bleed marks are included in export settings',
            description: 'Step 2',
          })}
        </Text>
        <Text size="small" alignment="center">
          {intl.formatMessage({
            defaultMessage: '3. Send to your printer with the spec sheet',
            description: 'Step 3',
          })}
        </Text>
      </Rows>

      <Button variant="secondary" onClick={onStartOver} stretch>
        {intl.formatMessage({
          defaultMessage: 'Start Over',
          description: 'Reset button',
        })}
      </Button>
    </Rows>
  );
}
