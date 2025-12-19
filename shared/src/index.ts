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
});

export type ExportRecord = z.infer<typeof ExportRecordSchema>;
