/**
 * Data Connector Intent for Printssistant
 * Provides access to print jobs and export data for import into Canva
 */

import "@canva/app-ui-kit/styles.css";
import type {
  DataConnectorIntent,
  GetDataTableRequest,
  GetDataTableResponse,
  RenderSelectionUiRequest,
  DataTable,
  ColumnConfig,
  DataTableRow,
} from "@canva/intents/data";
import { createRoot } from "react-dom/client";
import { DataConnectorView } from "./app";

// Backend host for API calls
// Use global BACKEND_HOST injected by Webpack
const apiHost = BACKEND_HOST;

/**
 * Get  data table for a specific data source reference
 */
async function getDataTable(
  request: GetDataTableRequest
): Promise<GetDataTableResponse> {
  const { dataSourceRef, limit, signal } = request;

  try {
    // Check if aborted
    if (signal.aborted) {
      return {
        status: "app_error",
        message: "The data fetch operation was cancelled.",
      };
    }

    // Parse the data source reference
    const sourceData = JSON.parse(dataSourceRef.source);
    const { type } = sourceData; // "jobs" or "exports"

    const endpoint = type === "jobs" ? "jobs" : "exports";
    const response = await fetch(
      `${apiHost}/api/${endpoint}?limit=${limit.row}`
    );

    if (!response.ok) {
      return {
        status: "remote_request_failed",
      };
    }

    const data = await response.json();

    // Transform data based on type
    let columnConfigs: ColumnConfig[];
    let rows: DataTableRow[];

    if (type === "jobs") {
      columnConfigs = [
        { name: "Job ID", type: "string" },
        { name: "SKU", type: "string" },
        { name: "Quantity", type: "number" },
        { name: "Status", type: "string" },
        { name: "Created Date", type: "string" },
        { name: "Exports Count", type: "number" },
      ];

      rows = data.map((job: any) => ({
        cells: [
          { type: "string" as const, value: job.id },
          { type: "string" as const, value: job.sku || "" },
          { type: "number" as const, value: job.quantity },
          { type: "string" as const, value: job.status },
          { type: "string" as const, value: job.createdAt },
          { type: "number" as const, value: job.exports?.length || 0 },
        ],
      }));
    } else {
      // exports
      columnConfigs = [
        { name: "Export ID", type: "string" },
        { name: "Job ID", type: "string" },
        { name: "SKU", type: "string" },
        { name: "Design Title", type: "string" },
        { name: "Customer Group", type: "string" },
        { name: "Created Date", type: "string" },
        { name: "File URL", type: "string" },
      ];

      rows = data.map((exp: any) => ({
        cells: [
          { type: "string" as const, value: exp.id },
          { type: "string" as const, value: exp.jobId || "" },
          { type: "string" as const, value: exp.sku || "" },
          { type: "string" as const, value: exp.designTitle || "" },
          { type: "string" as const, value: exp.customerGroup || "" },
          { type: "string" as const, value: exp.createdAt },
          { type: "string" as const, value: exp.exportUrl || "" },
        ],
      }));
    }

    const dataTable: DataTable = {
      columnConfigs,
      rows,
    };

    return {
      status: "completed",
      dataTable,
      metadata: {
        description: `${type === "jobs" ? "Print Jobs" : "Export Records"} from Printssistant`,
      },
    };
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return {
      status: "app_error",
      message:
        error instanceof Error ? error.message : "Failed to fetch data",
    };
  }
}

/**
 * Render the data connector selection UI
 */
function renderSelectionUi(request: RenderSelectionUiRequest): void {
  const root = createRoot(document.getElementById("root") as Element);
  root.render(<DataConnectorView request={request} />);
}

/**
 * Data Connector Intent implementation
 */
const dataConnector: DataConnectorIntent = {
  getDataTable,
  renderSelectionUi,
};

export default dataConnector;


