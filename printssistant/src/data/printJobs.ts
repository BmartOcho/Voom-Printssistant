/**
 * Print job presets with dimensions in inches.
 * NAMING RULE: All dimension properties use explicit "In" suffix.
 */

export interface PrintJob {
  id: string;
  name: string;
  widthIn: number;
  heightIn: number;
  bleedIn: number;
  safeMarginIn: number;
  category: 'business' | 'marketing' | 'large-format' | 'custom';
}

export const PRINT_JOBS: PrintJob[] = [
  // Business category
  {
    id: 'business-card',
    name: 'Business Card',
    widthIn: 3.5,
    heightIn: 2,
    bleedIn: 0.125,
    safeMarginIn: 0.125,
    category: 'business',
  },
  {
    id: 'letterhead',
    name: 'Letterhead',
    widthIn: 8.5,
    heightIn: 11,
    bleedIn: 0,
    safeMarginIn: 0.5,
    category: 'business',
  },
  {
    id: 'envelope-10',
    name: '#10 Envelope',
    widthIn: 9.5,
    heightIn: 4.125,
    bleedIn: 0.125,
    safeMarginIn: 0.25,
    category: 'business',
  },

  // Marketing category
  {
    id: 'postcard-4x6',
    name: 'Postcard 4×6',
    widthIn: 6,
    heightIn: 4,
    bleedIn: 0.125,
    safeMarginIn: 0.125,
    category: 'marketing',
  },
  {
    id: 'postcard-5x7',
    name: 'Postcard 5×7',
    widthIn: 7,
    heightIn: 5,
    bleedIn: 0.125,
    safeMarginIn: 0.125,
    category: 'marketing',
  },
  {
    id: 'flyer-letter',
    name: 'Flyer (Letter)',
    widthIn: 8.5,
    heightIn: 11,
    bleedIn: 0.125,
    safeMarginIn: 0.25,
    category: 'marketing',
  },
  {
    id: 'brochure-trifold',
    name: 'Tri-fold Brochure',
    widthIn: 11,
    heightIn: 8.5,
    bleedIn: 0.125,
    safeMarginIn: 0.25,
    category: 'marketing',
  },
  {
    id: 'poster-11x17',
    name: 'Poster 11×17',
    widthIn: 11,
    heightIn: 17,
    bleedIn: 0.125,
    safeMarginIn: 0.25,
    category: 'marketing',
  },

  // Large format category
  {
    id: 'poster-18x24',
    name: 'Poster 18×24',
    widthIn: 18,
    heightIn: 24,
    bleedIn: 0.25,
    safeMarginIn: 0.5,
    category: 'large-format',
  },
  {
    id: 'poster-24x36',
    name: 'Poster 24×36',
    widthIn: 24,
    heightIn: 36,
    bleedIn: 0.25,
    safeMarginIn: 0.5,
    category: 'large-format',
  },
  {
    id: 'banner-2x6',
    name: 'Banner 2×6 ft',
    widthIn: 24,
    heightIn: 72,
    bleedIn: 0.5,
    safeMarginIn: 1,
    category: 'large-format',
  },
  {
    id: 'banner-3x8',
    name: 'Banner 3×8 ft',
    widthIn: 36,
    heightIn: 96,
    bleedIn: 0.5,
    safeMarginIn: 1,
    category: 'large-format',
  },
];

/**
 * Group print jobs by category for UI display.
 */
export function getJobsByCategory(): Record<string, PrintJob[]> {
  const grouped: Record<string, PrintJob[]> = {};
  for (const job of PRINT_JOBS) {
    if (!grouped[job.category]) {
      grouped[job.category] = [];
    }
    grouped[job.category].push(job);
  }
  return grouped;
}

/**
 * Get category display name.
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    business: 'Business',
    marketing: 'Marketing',
    'large-format': 'Large Format',
    custom: 'Custom',
  };
  return labels[category] || category;
}
