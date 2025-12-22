import { z } from "zod";

// --- Product Rules ---

export const ProductRuleSchema = z.object({
  sku: z.string(),
  trimWidthIn: z.number(),
  trimHeightIn: z.number(),
  bleedIn: z.number(),
  safeMarginIn: z.number(),
  allowMultiPage: z.boolean(),
  notes: z.string().optional(),
  export: z.object({
    acceptedFileTypes: z.array(z.enum(["pdf_standard", "png", "jpg"])),
    recommended: z.literal("pdf_standard"),
    instructions: z.string()
  })
});

export type ProductRule = z.infer<typeof ProductRuleSchema>;

// --- Template Mappings ---

export const TemplateMappingSchema = z.object({
  sku: z.string(),
  customerGroup: z.string(),
  templateId: z.string(),
  templateName: z.string().optional()
});

export type TemplateMapping = z.infer<typeof TemplateMappingSchema>;

// --- Exports ---

export const ExportPayloadSchema = z.object({
  sku: z.string().min(1),
  jobId: z.string().optional(),
  customerGroup: z.string().optional(),
  designTitle: z.string().optional(),
  exportUrl: z.string().url(),
  canvaDesignId: z.string().optional(),
  returnUrl: z.string().optional(),
  raw: z.unknown().optional()
});

export type ExportPayload = z.infer<typeof ExportPayloadSchema>;

export const ExportRecordSchema = ExportPayloadSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime()
}).extend({
  // Local file path where the exported PDF is stored (optional)
  filePath: z.string().optional()
});

export type ExportRecord = z.infer<typeof ExportRecordSchema>;

// --- Jobs ---

/**
 * A Job represents a print order. It holds the SKU of the product being ordered,
 * the quantity desired, a status indicating whether artwork has been attached,
 * a list of attached export records, and timestamps. The status field can be
 * extended in the future to include additional order states (e.g. approved,
 * in_production), but for now we keep it simple.
 */
export const JobSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  quantity: z.number().int().min(1).default(1),
  status: z.enum(["artwork_pending", "artwork_ready"]),
  exports: z.array(ExportRecordSchema),
  createdAt: z.string().datetime()
});

export type Job = z.infer<typeof JobSchema>;

/**
 * When creating a job, only the SKU and an optional quantity are required.
 * Other fields (id, createdAt, status, exports) are filled in by the backend.
 */
export const JobCreateSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().min(1).optional()
});

export type JobCreate = z.infer<typeof JobCreateSchema>;
