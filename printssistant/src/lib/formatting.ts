/**
 * Formatting utilities for print dimensions and DPI.
 */

/**
 * Format a number as inches with proper display.
 * Shows whole numbers without decimals, fractions as needed.
 */
export function formatInches(n: number): string {
  if (Number.isInteger(n)) {
    return `${n}"`;
  }
  // Round to 3 decimal places for display
  return `${n.toFixed(3).replace(/\.?0+$/, '')}"`;
}

/**
 * Format dimensions as "W × H" string.
 */
export function formatDimensions(widthIn: number, heightIn: number): string {
  return `${formatInches(widthIn)} × ${formatInches(heightIn)}`;
}

/**
 * Calculate DPI given pixel dimensions and target print size in inches.
 */
export function calculateDPI(pixelWidth: number, targetInches: number): number {
  if (targetInches <= 0) return 0;
  return Math.round(pixelWidth / targetInches);
}

/**
 * Convert points to inches. Canva uses 72 points per inch.
 */
export function pointsToInches(points: number): number {
  return points / 72;
}

/**
 * Convert inches to points.
 */
export function inchesToPoints(inches: number): number {
  return inches * 72;
}

/**
 * Check if two dimensions match within a tolerance.
 * Default tolerance is 0.1 inches.
 */
export function dimensionsMatch(
  widthIn1: number,
  heightIn1: number,
  widthIn2: number,
  heightIn2: number,
  toleranceIn: number = 0.1
): boolean {
  const widthMatch = Math.abs(widthIn1 - widthIn2) <= toleranceIn;
  const heightMatch = Math.abs(heightIn1 - heightIn2) <= toleranceIn;
  return widthMatch && heightMatch;
}

/**
 * Format a percentage for progress display.
 */
export function formatProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
