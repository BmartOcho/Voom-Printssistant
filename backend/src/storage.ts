import fs from "node:fs";
import path from "node:path";
import {
  ExportRecord,
  ProductRule,
  TemplateMapping,
  Job
} from "./types.js";

type DbShape = {
  rules: ProductRule[];
  templates: TemplateMapping[];
  exports: ExportRecord[];
  jobs: Job[];       // <-- new jobs array
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export class JsonDb {
  private filePath: string;
  private data: DbShape;

  constructor(dataDir: string) {
    ensureDir(dataDir);
    this.filePath = path.join(dataDir, "db.json");

    if (!fs.existsSync(this.filePath)) {
      // Seed with a sane default
      const seed: DbShape = {
        rules: [
          {
            sku: "POSTCARD_4x6",
            trimWidthIn: 6,
            trimHeightIn: 4,
            bleedIn: 0.125,
            safeMarginIn: 0.25,
            allowMultiPage: false,
            notes: "Standard 4x6 postcard, full bleed.",
            export: {
              acceptedFileTypes: ["pdf_standard"],
              recommended: "pdf_standard",
              instructions:
                "Export as PDF (Standard). In the export dialog, enable bleed if offered. Do not resize."
            }
          }
        ],
        templates: [
          {
            sku: "POSTCARD_4x6",
            customerGroup: "default",
            templateId: "REPLACE_WITH_CANVA_TEMPLATE_ID",
            templateName: "4x6 Postcard (Full Bleed)"
          }
        ],
        exports: [],
        jobs: []          // <-- seed with empty jobs array
      };
      fs.writeFileSync(this.filePath, JSON.stringify(seed, null, 2), "utf-8");
    }

    this.data = JSON.parse(fs.readFileSync(this.filePath, "utf-8")) as DbShape;
    if (!this.data.jobs) this.data.jobs = [];
  }

  private flush() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
  }

  getRule(sku: string) {
    return this.data.rules.find((r) => r.sku === sku) ?? null;
  }

  getTemplate(sku: string, customerGroup: string) {
    return (
      this.data.templates.find(
        (t) => t.sku === sku && t.customerGroup === customerGroup
      ) ?? null
    );
  }

  listRules() {
    return this.data.rules;
  }

  upsertRule(rule: ProductRule) {
    const idx = this.data.rules.findIndex((r) => r.sku === rule.sku);
    if (idx >= 0) this.data.rules[idx] = rule;
    else this.data.rules.push(rule);
    this.flush();
    return rule;
  }

  upsertTemplate(mapping: TemplateMapping) {
    const idx = this.data.templates.findIndex(
      (t) => t.sku === mapping.sku && t.customerGroup === mapping.customerGroup
    );
    if (idx >= 0) this.data.templates[idx] = mapping;
    else this.data.templates.push(mapping);
    this.flush();
    return mapping;
  }

  addExport(rec: ExportRecord) {
    this.data.exports.unshift(rec);
    // Keep it from exploding during dev
    this.data.exports = this.data.exports.slice(0, 5000);
    this.flush();
    return rec;
  }

  listExports(limit = 50) {
    return this.data.exports.slice(0, limit);
  }

  // --- Jobs ---

  listJobs(limit = 50) {
    return this.data.jobs.slice(0, limit);
  }

  getJob(id: string) {
    return this.data.jobs.find((j) => j.id === id) ?? null;
  }

  addJob(job: Job) {
    this.data.jobs.unshift(job);
    this.flush();
    return job;
  }

  attachExportToJob(jobId: string, rec: ExportRecord) {
    const job = this.data.jobs.find((j) => j.id === jobId);
    if (job) {
      job.exports.push(rec);
      job.status = "artwork_ready";
      this.flush();
    }
    return job;
  }
}
