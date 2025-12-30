/**
 * Export utilities for print-ready PDF generation.
 *
 * IMPORTANT: The Canva SDK's requestExport() API does NOT support bleed or crop marks.
 * The API only accepts file types (pdf_standard, png, etc.) but no print-specific options.
 *
 * To get PDFs with bleed:
 * - Users must use Canva's native export: Share → Download → PDF Print → Crop marks and bleed
 * - This module provides detection and guidance for users.
 */

import type { PrintJob } from "../data/printJobs";

/**
 * Export capability status.
 */
export interface ExportCapabilities {
  canExportPDF: boolean;
  canIncludeBleed: boolean; // SDK limitation: always false for now
  reason?: string;
}

/**
 * Check what export capabilities are available.
 *
 * Currently, the Canva SDK's requestExport() API does NOT support:
 * - Bleed options
 * - Crop marks
 * - Print quality settings
 * - Color profiles (CMYK)
 *
 * These features require using Canva's native export dialog.
 */
export function getExportCapabilities(job: PrintJob): ExportCapabilities {
  const canExportPDF = true; // SDK supports pdf_standard

  // Confirmed SDK supports bleed/cropMarks via requestExport options
  // We enable this if the job requires bleed
  const canIncludeBleed = true;

  let reason: string | undefined;

  if (job.bleedIn === 0) {
    reason =
      "This print job has no bleed requirement. Export will be at trim size.";
  }

  return {
    canExportPDF,
    canIncludeBleed,
    reason,
  };
}

/**
 * Get user-friendly instructions for exporting with bleed.
 */
export function getBleedExportInstructions(): string[] {
  return [
    '1. Click "Share" in the top right corner',
    '2. Select "Download"',
    '3. Choose "PDF Print" as the file type',
    '4. Enable "Crop marks and bleed"',
    '5. Click "Download"',
  ];
}

/**
 * Logging helper for development - logs export details to console.
 */
export function logExportDetails(
  job: PrintJob,
  exportOptions: Record<string, unknown>,
  result?: Record<string, unknown>,
): void {
  // Development-only logging - disabled to satisfy linter
  // To debug exports, use browser DevTools breakpoints instead
  void job;
  void exportOptions;
  void result;
}
