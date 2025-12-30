/**
 * DPI guidelines for print quality assessment.
 */

import { defineMessages, type MessageDescriptor } from "react-intl";

export interface DPIThreshold {
  min: number;
  status: "excellent" | "good" | "acceptable" | "warning" | "low";
  label: MessageDescriptor;
  color: "positive" | "info" | "warn" | "critical";
}

const messages = defineMessages({
  excellent: {
    defaultMessage: "Excellent",
    description: "DPI status excellent",
  },
  good: {
    defaultMessage: "Good",
    description: "DPI status good",
  },
  acceptable: {
    defaultMessage: "Acceptable",
    description: "DPI status acceptable",
  },
  lowQuality: {
    defaultMessage: "Low Quality",
    description: "DPI status warning",
  },
  tooLow: {
    defaultMessage: "Too Low",
    description: "DPI status critical",
  },
});

export const DPI_THRESHOLDS: DPIThreshold[] = [
  {
    min: 300,
    status: "excellent",
    label: messages.excellent,
    color: "positive",
  },
  { min: 200, status: "good", label: messages.good, color: "positive" },
  {
    min: 150,
    status: "acceptable",
    label: messages.acceptable,
    color: "info",
  },
  { min: 100, status: "warning", label: messages.lowQuality, color: "warn" },
  { min: 0, status: "low", label: messages.tooLow, color: "critical" },
];

/**
 * Get DPI status based on calculated DPI value.
 */
export function getDPIStatus(dpi: number): DPIThreshold {
  return (
    DPI_THRESHOLDS.find((t) => dpi >= t.min) ||
    (DPI_THRESHOLDS[DPI_THRESHOLDS.length - 1] as DPIThreshold)
  );
}

/**
 * Tips based on job category for large format vs standard print.
 */
export interface DPIGuideline {
  category: string;
  minRecommendedDPI: number;
  tips: MessageDescriptor[];
}

const tipMessages = defineMessages({
  business_1: {
    defaultMessage:
      "Business cards are viewed up close - 300 DPI minimum is essential.",
    description: "Tip for business cards",
  },
  business_2: {
    defaultMessage: "Text and logos should be vector whenever possible.",
    description: "Tip for business cards",
  },
  business_3: {
    defaultMessage: "Avoid enlarging low-resolution images.",
    description: "Tip for business cards",
  },
  marketing_1: {
    defaultMessage: "Marketing materials should look crisp at arm length.",
    description: "Tip for marketing",
  },
  marketing_2: {
    defaultMessage: "For postcards and flyers, 300 DPI ensures sharp images.",
    description: "Tip for marketing",
  },
  marketing_3: {
    defaultMessage: "Photos should be at least 300 PPI at final size.",
    description: "Tip for marketing",
  },
  largeFormat_1: {
    defaultMessage:
      "Large format prints are viewed from a distance - 150 DPI is often sufficient.",
    description: "Tip for large format",
  },
  largeFormat_2: {
    defaultMessage: "Banners viewed from 10+ feet can go as low as 75-100 DPI.",
    description: "Tip for large format",
  },
  largeFormat_3: {
    defaultMessage:
      "Do not panic about lower DPI on large prints - viewing distance matters!",
    description: "Tip for large format",
  },
  custom_1: {
    defaultMessage: "Consider the typical viewing distance for your print.",
    description: "Tip for custom jobs",
  },
  custom_2: {
    defaultMessage: "Higher DPI is always safer if in doubt.",
    description: "Tip for custom jobs",
  },
  custom_3: {
    defaultMessage: "Vector graphics scale infinitely without quality loss.",
    description: "Tip for custom jobs",
  },
});

export const DPI_GUIDELINES: DPIGuideline[] = [
  {
    category: "business",
    minRecommendedDPI: 300,
    tips: [
      tipMessages.business_1,
      tipMessages.business_2,
      tipMessages.business_3,
    ],
  },
  {
    category: "marketing",
    minRecommendedDPI: 300,
    tips: [
      tipMessages.marketing_1,
      tipMessages.marketing_2,
      tipMessages.marketing_3,
    ],
  },
  {
    category: "large-format",
    minRecommendedDPI: 150,
    tips: [
      tipMessages.largeFormat_1,
      tipMessages.largeFormat_2,
      tipMessages.largeFormat_3,
    ],
  },
  {
    category: "custom",
    minRecommendedDPI: 200,
    tips: [tipMessages.custom_1, tipMessages.custom_2, tipMessages.custom_3],
  },
];

/**
 * Get DPI guideline for a job category.
 */
export function getGuidelineForCategory(category: string): DPIGuideline {
  return (
    DPI_GUIDELINES.find((g) => g.category === category) ||
    (DPI_GUIDELINES[3] as DPIGuideline)
  );
}
