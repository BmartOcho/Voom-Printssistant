/**
 * DPI guidelines for print quality assessment.
 */

export interface DPIThreshold {
  min: number;
  status: 'excellent' | 'good' | 'acceptable' | 'warning' | 'low';
  label: string;
  color: 'positive' | 'info' | 'warn' | 'critical';
}

export const DPI_THRESHOLDS: DPIThreshold[] = [
  { min: 300, status: 'excellent', label: 'Excellent', color: 'positive' },
  { min: 200, status: 'good', label: 'Good', color: 'positive' },
  { min: 150, status: 'acceptable', label: 'Acceptable', color: 'info' },
  { min: 100, status: 'warning', label: 'Low Quality', color: 'warn' },
  { min: 0, status: 'low', label: 'Too Low', color: 'critical' },
];

/**
 * Get DPI status based on calculated DPI value.
 */
export function getDPIStatus(dpi: number): DPIThreshold {
  for (const threshold of DPI_THRESHOLDS) {
    if (dpi >= threshold.min) {
      return threshold;
    }
  }
  return DPI_THRESHOLDS[DPI_THRESHOLDS.length - 1];
}

/**
 * Tips based on job category for large format vs standard print.
 */
export interface DPIGuideline {
  category: string;
  minRecommendedDPI: number;
  tips: string[];
}

export const DPI_GUIDELINES: DPIGuideline[] = [
  {
    category: 'business',
    minRecommendedDPI: 300,
    tips: [
      'Business cards are viewed up close - 300 DPI minimum is essential.',
      'Text and logos should be vector whenever possible.',
      'Avoid enlarging low-resolution images.',
    ],
  },
  {
    category: 'marketing',
    minRecommendedDPI: 300,
    tips: [
      'Marketing materials should look crisp at arm length.',
      'For postcards and flyers, 300 DPI ensures sharp images.',
      'Photos should be at least 300 PPI at final size.',
    ],
  },
  {
    category: 'large-format',
    minRecommendedDPI: 150,
    tips: [
      'Large format prints are viewed from a distance - 150 DPI is often sufficient.',
      'Banners viewed from 10+ feet can go as low as 75-100 DPI.',
      'Do not panic about lower DPI on large prints - viewing distance matters!',
    ],
  },
  {
    category: 'custom',
    minRecommendedDPI: 200,
    tips: [
      'Consider the typical viewing distance for your print.',
      'Higher DPI is always safer if in doubt.',
      'Vector graphics scale infinitely without quality loss.',
    ],
  },
];

/**
 * Get DPI guideline for a job category.
 */
export function getGuidelineForCategory(category: string): DPIGuideline {
  return (
    DPI_GUIDELINES.find((g) => g.category === category) || DPI_GUIDELINES[3]
  );
}
