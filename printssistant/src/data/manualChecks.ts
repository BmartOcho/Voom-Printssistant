/**
 * Manual preflight checks for print preparation.
 */

export interface ManualCheck {
  id: string;
  title: string;
  description: string;
  tip?: string;
  required: boolean;
  category: "safety" | "color" | "content";
}

export const MANUAL_CHECKS: ManualCheck[] = [
  // Required checks (safety category)
  {
    id: "bleed-check",
    title: "Bleed Check",
    description:
      "Extend background colors and images to the bleed line to prevent white edges after trimming.",
    tip: 'Most commercial printers require 0.125" (1/8") bleed on all sides.',
    required: true,
    category: "safety",
  },
  {
    id: "safe-zone-check",
    title: "Safe Zone Check",
    description:
      "Keep important text and logos within the safe margin to avoid being cut off.",
    tip: 'A 0.125" safe margin from trim edge is standard for most print jobs.',
    required: true,
    category: "safety",
  },

  // Optional checks (color category)
  {
    id: "color-mode-check",
    title: "Color Mode (CMYK)",
    description:
      "Verify colors will print accurately. RGB colors may shift when converted to CMYK.",
    tip: "Bright neons and some blues/greens are especially prone to color shift.",
    required: false,
    category: "color",
  },
  {
    id: "rich-black-check",
    title: "Rich Black",
    description:
      "For large black areas, consider using rich black (C60 M40 Y40 K100) instead of pure black.",
    tip: "Pure black (K100) can appear washed out on large solid areas.",
    required: false,
    category: "color",
  },

  // Optional checks (content category)
  {
    id: "font-check",
    title: "Font Outline Check",
    description:
      "Ensure fonts are embedded or converted to outlines to prevent substitution.",
    tip: "Canva exports generally embed fonts, but verify with your printer.",
    required: false,
    category: "content",
  },
  {
    id: "spell-check",
    title: "Spelling & Grammar",
    description: "Review all text for typos before sending to print.",
    tip: "Print errors are costly—double-check phone numbers and URLs!",
    required: false,
    category: "content",
  },
];

/**
 * Get required checks only.
 */
export function getRequiredChecks(): ManualCheck[] {
  return MANUAL_CHECKS.filter((c) => c.required);
}

/**
 * Get optional checks only.
 */
export function getOptionalChecks(): ManualCheck[] {
  return MANUAL_CHECKS.filter((c) => !c.required);
}

/**
 * Get checks grouped by category.
 */
export function getChecksByCategory(): Record<string, ManualCheck[]> {
  const grouped: Record<string, ManualCheck[]> = {};
  for (const check of MANUAL_CHECKS) {
    if (!grouped[check.category]) {
      grouped[check.category] = [];
    }
    grouped[check.category].push(check);
  }
  return grouped;
}
