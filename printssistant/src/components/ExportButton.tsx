/**
 * Export Button component with loading and error states.
 * Handles print-ready PDF export with backend or offline fallback.
 */

import { useState } from 'react';
import { Alert, Button, LoadingIndicator, Rows, Text } from '@canva/app-ui-kit';
import { useIntl } from 'react-intl';
import { useFeatureSupport } from '@canva/app-hooks';
import { requestExport } from '@canva/design';
import { requestOpenExternalUrl } from '@canva/platform';
import type { PrintJob } from '../data/printJobs';
import { isBackendEnabled, postExport } from '../lib/api';

interface ExportButtonProps {
  job: PrintJob;
  completedChecks: string[];
  designTitle?: string;
}

type ExportStatus = 'idle' | 'preparing' | 'exporting' | 'success' | 'error';

export function ExportButton({ job, completedChecks, designTitle }: ExportButtonProps) {
  const intl = useIntl();
  const isSupported = useFeatureSupport();
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canExport = isSupported(requestExport);

  const handleExport = async () => {
    setStatus('preparing');
    setErrorMessage(null);

    try {
      // Check if Canva export is supported
      if (!canExport) {
        throw new Error('Export is not available in this context.');
      }

      setStatus('exporting');

      // Request export from Canva
      const result = await requestExport({
        acceptedFileTypes: ['pdf_standard'],
      });

      // Handle user cancellation
      if ((result as { status?: string }).status === 'aborted') {
        setStatus('idle');
        return;
      }

      const exportResult = result as {
        status: string;
        title?: string;
        exportBlobs?: Array<{ url: string }>;
      };

      const exportUrl = exportResult.exportBlobs?.[0]?.url;

      if (!exportUrl) {
        throw new Error('Export completed but no file was generated.');
      }

      // If backend is available, send export record
      if (isBackendEnabled()) {
        try {
          await postExport({
            sku: job.id,
            designTitle: designTitle || exportResult.title,
            exportUrl,
          });
        } catch (backendError) {
          // Non-blocking: log but don't fail the export
          console.warn('[ExportButton] Backend sync failed:', backendError);
        }
      }

      // Open the download URL
      await requestOpenExternalUrl({ url: exportUrl });

      setStatus('success');

      // Reset after showing success
      setTimeout(() => {
        setStatus('idle');
      }, 5000);

    } catch (error) {
      console.error('[ExportButton] Export failed:', error);
      setStatus('error');
      setErrorMessage(
        intl.formatMessage({
          defaultMessage:
            'We could not generate your file. Please try again or export manually from the Share menu.',
          description: 'Export error message',
        })
      );
    }
  };

  const handleRetry = () => {
    setErrorMessage(null);
    handleExport();
  };

  // Loading state
  if (status === 'preparing' || status === 'exporting') {
    return (
      <Rows spacing="1u" align="center">
        <LoadingIndicator size="medium" />
        <Text alignment="center" size="small" tone="tertiary">
          {status === 'preparing'
            ? intl.formatMessage({
                defaultMessage: 'Preparing your file...',
                description: 'Export preparing state',
              })
            : intl.formatMessage({
                defaultMessage: 'Generating print-ready PDF...',
                description: 'Export generating state',
              })}
        </Text>
      </Rows>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <Rows spacing="1u">
        <Alert tone="warn">
          <Text size="small">{errorMessage}</Text>
        </Alert>
        <Button variant="secondary" onClick={handleRetry} stretch>
          {intl.formatMessage({
            defaultMessage: 'Try Again',
            description: 'Retry export button',
          })}
        </Button>
      </Rows>
    );
  }

  // Success state (brief confirmation)
  if (status === 'success') {
    return (
      <Alert tone="positive">
        <Text size="small">
          {intl.formatMessage({
            defaultMessage: 'Your print-ready file is ready!',
            description: 'Export success message',
          })}
        </Text>
      </Alert>
    );
  }

  // Default idle state
  return (
    <Rows spacing="0.5u">
      <Button
        variant="primary"
        onClick={handleExport}
        disabled={!canExport}
        stretch
        tooltipLabel={
          !canExport
            ? intl.formatMessage({
                defaultMessage: 'Export is not available in this preview',
                description: 'Export unavailable tooltip',
              })
            : undefined
        }
      >
        {intl.formatMessage({
          defaultMessage: 'Download Print-Ready PDF',
          description: 'Primary export button',
        })}
      </Button>
      <Text size="xsmall" tone="tertiary" alignment="center">
        {intl.formatMessage({
          defaultMessage: 'This file meets standard commercial print requirements.',
          description: 'Export reassurance text',
        })}
      </Text>
    </Rows>
  );
}
