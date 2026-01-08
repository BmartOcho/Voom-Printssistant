/**
 * Data Connector View - UI for selecting and importing data sources
 */

import { useState, useEffect, useCallback } from "react";
import { AppI18nProvider } from "@canva/app-i18n-kit";
import { AppUiProvider } from "@canva/app-ui-kit";
import { useIntl, FormattedMessage } from "react-intl";
import {
  Alert,
  Button,
  Rows,
  Select,
  Text,
  Title,
  LoadingIndicator,
} from "@canva/app-ui-kit";
import type { RenderSelectionUiRequest } from "@canva/intents/data";
import * as styles from "styles/components.css";

// Backend host
const apiHost = BACKEND_HOST;

interface DataSource {
  id: string;
  name: string;
  description: string;
}

const DATA_SOURCES: DataSource[] = [
  {
    id: "print_jobs",
    name: "Print Jobs",
    description: "All print jobs with status and specifications",
  },
  {
    id: "exports",
    name: "Exported Files",
    description: "PDF exports and artwork files",
  },
];

// Types for preview data
interface PrintJob {
  id: string;
  sku: string;
  quantity: number;
  status: string;
}

interface ExportRecord {
  id: string;
  sku: string;
  designTitle: string;
}

type PreviewItem = PrintJob | ExportRecord;

// Type guard
function isPrintJob(item: PreviewItem): item is PrintJob {
  return "quantity" in item;
}

interface DataConnectorContentProps {
  request: RenderSelectionUiRequest;
}

function DataConnectorContent({ request }: DataConnectorContentProps) {
  const intl = useIntl();
  const [selectedSource, setSelectedSource] = useState<string>("print_jobs");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewItem[] | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchPreview = useCallback(async (sourceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = sourceId === "print_jobs" ? "jobs" : "exports";
      const response = await fetch(
        `${apiHost}/api/${endpoint}?limit=5`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      const data = await response.json();
      setPreviewData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreview(selectedSource);
  }, [selectedSource, fetchPreview]);

  const handleImport = useCallback(async () => {
    setImporting(true);
    setError(null);
    try {
      // Create a data source reference
      const dataSourceRef = {
        source: JSON.stringify({ type: selectedSource }),
        title: DATA_SOURCES.find((s) => s.id === selectedSource)?.name || selectedSource,
      };

      // Call updateDataRef to import the data
      const result = await request.updateDataRef(dataSourceRef);

      if (result.status === "completed") {
        // Success handled by Canva closing/updating
      } else {
        throw new Error("Failed to import data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import data");
    } finally {
      setImporting(false);
    }
  }, [selectedSource, request]);

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        {/* Header */}
        <Title size="small">
          <FormattedMessage
            defaultMessage="Data Connector"
            description="Data connector title"
          />
        </Title>
        <Text>
          <FormattedMessage
            defaultMessage="Import print jobs and export data into Canva"
            description="Data connector subtitle"
          />
        </Text>

        {/* Data Source Selector */}
        <Select
          onChange={(value) => setSelectedSource(value)}
          value={selectedSource}
          options={DATA_SOURCES.map((source) => ({
            value: source.id,
            label: source.name,
          }))}
        />

        {/* Description */}
        {selectedSource && (
          <Text size="small" tone="tertiary">
            {DATA_SOURCES.find((s) => s.id === selectedSource)?.description}
          </Text>
        )}

        {/* Error Alert */}
        {error && (
          <Alert tone="critical">
            <Text>{error}</Text>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Rows spacing="1u" align="center">
            <LoadingIndicator size="medium" />
            <Text>
              <FormattedMessage
                defaultMessage="Loading preview..."
                description="Loading message"
              />
            </Text>
          </Rows>
        )}

        {/* Preview Table */}
        {!loading && previewData && (
          <div>
            <Text size="small" tone="secondary">
              <FormattedMessage
                defaultMessage="Preview ({count} of many records)"
                description="Preview count"
                values={{ count: previewData.length }}
              />
            </Text>
            <div
              style={{
                marginTop: "8px",
                padding: "12px",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                maxHeight: "300px",
                overflow: "auto",
              }}
            >
              <table style={{ width: "100%", fontSize: "12px" }}>
                <thead>
                  <tr>
                    {selectedSource === "print_jobs" ? (
                      <>
                        <th style={{ textAlign: "left", padding: "4px" }}>
                          <FormattedMessage defaultMessage="Job ID" description="Table header Job ID" />
                        </th>
                        <th style={{ textAlign: "left", padding: "4px" }}>
                          <FormattedMessage defaultMessage="SKU" description="Table header SKU" />
                        </th>
                        <th style={{ textAlign: "left", padding: "4px" }}>
                          <FormattedMessage defaultMessage="Qty" description="Table header Quantity" />
                        </th>
                        <th style={{ textAlign: "left", padding: "4px" }}>
                          <FormattedMessage defaultMessage="Status" description="Table header Status" />
                        </th>
                      </>
                    ) : (
                      <>
                        <th style={{ textAlign: "left", padding: "4px" }}>
                          <FormattedMessage defaultMessage="Export ID" description="Table header Export ID" />
                        </th>
                        <th style={{ textAlign: "left", padding: "4px" }}>
                          <FormattedMessage defaultMessage="SKU" description="Table header SKU" />
                        </th>
                        <th style={{ textAlign: "left", padding: "4px" }}>
                          <FormattedMessage defaultMessage="Title" description="Table header Title" />
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((item) => {
                    if (isPrintJob(item)) {
                      return (
                        <tr key={item.id}>
                          <td style={{ padding: "4px" }}>{item.id}</td>
                          <td style={{ padding: "4px" }}>{item.sku}</td>
                          <td style={{ padding: "4px" }}>{item.quantity}</td>
                          <td style={{ padding: "4px" }}>{item.status}</td>
                        </tr>
                      );
                    } else {
                       // ExportRecord
                       return (
                        <tr key={item.id}>
                          <td style={{ padding: "4px" }}>{item.id.substring(0, 8)}...</td>
                          <td style={{ padding: "4px" }}>{item.sku}</td>
                          <td style={{ padding: "4px" }}>{item.designTitle || "-"}</td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import Button */}
        <Button
          variant="primary"
          onClick={handleImport}
          disabled={loading || !previewData || importing}
          stretch
        >
          {importing
            ? intl.formatMessage({
                defaultMessage: "Importing...",
                description: "Import button loading state",
              })
            : intl.formatMessage({
                defaultMessage: "Import Data to Canva",
                description: "Import button default state",
              })}
        </Button>
      </Rows>
    </div>
  );
}

export function DataConnectorView({ request }: { request: RenderSelectionUiRequest }) {
  return (
    <AppI18nProvider>
      <AppUiProvider>
        <DataConnectorContent request={request} />
      </AppUiProvider>
    </AppI18nProvider>
  );
}
