import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { z } from "zod";
import { JsonDb } from "./storage.js";
import {
  ExportRecord,
  ExportPayloadSchema,
  ProductRule,
  ProductRuleSchema,
  Job,
  JobCreateSchema
} from "@printssistant/shared";
import crypto from "node:crypto";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT ?? 8787);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";
const DATA_DIR = process.env.DATA_DIR ?? "./data";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "secret123";

const db = new JsonDb(DATA_DIR);

// Ensure exports directory exists
const EXPORTS_DIR = path.join(DATA_DIR, "exports");
if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

/**
 * Download a file from a URL and save it to the exports directory.
 * Returns the absolute path to the saved file.
 */
async function downloadExportFile(url: string, id: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download export: ${res.status} ${res.statusText}`);
  }
  const filePath = path.join(EXPORTS_DIR, `${id}.pdf`);
  const writeStream = fs.createWriteStream(filePath);
  // Use stream pipeline to pipe the response body to the file
  await pipeline(res.body as any, writeStream);
  return filePath;
}

const app = express();
app.use(cors({ origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN }));
app.use(express.json({ limit: "10mb" }));

// --- Public API ---

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/rules", (req, res) => {
  const sku = String(req.query.sku ?? "").trim();
  if (!sku) return res.status(400).json({ error: "Missing sku" });

  const rule = db.getRule(sku);
  if (!rule) return res.status(404).json({ error: "Rule not found", sku });

  res.json(rule);
});

app.get("/api/templates", (req, res) => {
  const sku = String(req.query.sku ?? "").trim();
  const group = String(req.query.group ?? "default").trim();

  if (!sku) return res.status(400).json({ error: "Missing sku" });

  const tpl = db.getTemplate(sku, group);
  if (!tpl)
    return res.status(404).json({ error: "Template not found", sku, group });

  res.json(tpl);
});

app.post("/api/exports", (req, res) => {
  const parsed = ExportPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      issues: parsed.error.issues
    });
  }

  const body = parsed.data;

  const rec: ExportRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    sku: body.sku,
    jobId: body.jobId,
    customerGroup: body.customerGroup,
    designTitle: body.designTitle,
    exportUrl: body.exportUrl,
    canvaDesignId: body.canvaDesignId,
    returnUrl: body.returnUrl,
    raw: body.raw
  };

  // Download the PDF and store it locally.
  downloadExportFile(body.exportUrl, rec.id)
    .then((filePath) => {
      rec.filePath = filePath;
      db.addExport(rec);
      // If a jobId was provided, attach this export to the job
      if (body.jobId) {
        db.attachExportToJob(body.jobId, rec);
      }
      res.json({ ok: true, record: rec });
    })
    .catch((err) => {
      console.error("Failed to download and store export:", err);
      db.addExport(rec);
      if (body.jobId) {
      db.attachExportToJob(body.jobId, rec);
      }
      res.json({ ok: true, record: rec });
    });
});

// Serve stored PDF exports
app.get("/api/exports/:id/download", (req, res) => {
  const id = req.params.id;
  const rec = db.listExports().find((e) => e.id === id);
  if (!rec || !rec.filePath) {
    return res.status(404).json({ error: "Export not found or file not stored" });
  }
  res.sendFile(path.resolve(rec.filePath));
});

app.get("/api/exports", (req, res) => {
  const limit = Number(req.query.limit ?? 50);
  res.json(db.listExports(Number.isFinite(limit) ? limit : 50));
});

// --- Jobs API ---

// Create a new job
app.post("/api/jobs", (req, res) => {
  try {
    const data = JobCreateSchema.parse(req.body);
    const job: Job = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      sku: data.sku,
      quantity: data.quantity ?? 1,
      status: "artwork_pending",
      exports: []
    };
    db.addJob(job);
    res.json({ ok: true, job });
  } catch (e: any) {
    res.status(400).json({ error: "Invalid job payload", issues: e.errors ?? e });
  }
});

// List jobs
app.get("/api/jobs", (req, res) => {
  const limit = Number(req.query.limit ?? 50);
  res.json(db.listJobs(Number.isFinite(limit) ? limit : 50));
});

// Get a specific job by ID
app.get("/api/jobs/:jobId", (req, res) => {
  const job = db.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

// --- Admin API ---

const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers["x-admin-token"];
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

app.get("/api/admin/rules", adminAuth, (req, res) => {
  res.json(db.listRules());
});

app.put("/api/admin/rules/:sku", adminAuth, (req, res) => {
  const sku = req.params.sku;
  const parsed = ProductRuleSchema.safeParse(req.body);
  
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid rule format", issues: parsed.error.issues });
  }
  
  const rule = parsed.data;
  if (rule.sku !== sku) {
    return res.status(400).json({ error: "SKU mismatch in path and body" });
  }

  db.upsertRule(rule);
  res.json({ ok: true, rule });
});

// --- Admin UI ---

app.get("/admin", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Printssistant Admin</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
        .card { border: 1px solid #ccc; padding: 1rem; margin-bottom: 1rem; border-radius: 4px; }
        label { display: block; margin-bottom: 0.5rem; }
        input, select, textarea { width: 100%; margin-bottom: 1rem; padding: 0.5rem; }
        button { padding: 0.5rem 1rem; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Printssistant Rules Admin</h1>
    
    <div id="auth-section">
        <label>Admin Token:</label>
        <input type="password" id="admin-token" value="secret123" />
        <button onclick="loadRules()">Load Rules</button>
    </div>

    <hr />

    <div id="rules-list"></div>

    <div id="editor" style="display:none;" class="card">
        <h3>Edit Rule: <span id="editor-sku"></span></h3>
        <textarea id="rule-json" rows="20"></textarea>
        <button onclick="saveRule()">Save Rule</button>
        <button onclick="document.getElementById('editor').style.display='none'">Cancel</button>
    </div>

    <script>
        const API_URL = "http://localhost:8787/api";

        function getToken() {
            return document.getElementById("admin-token").value;
        }

        async function loadRules() {
            const res = await fetch(API_URL + "/admin/rules", {
                headers: { "x-admin-token": getToken() }
            });
            if (!res.ok) return alert("Failed to load rules: " + res.statusText);
            const rules = await res.json();
            renderRules(rules);
        }

        function renderRules(rules) {
            const container = document.getElementById("rules-list");
            container.innerHTML = rules.map(r => \`
                <div class="card">
                    <strong>\${r.sku}</strong>
                    <br/>
                    Trim: \${r.trimWidthIn}" x \${r.trimHeightIn}"
                    <br/>
                    <button onclick='editRule(\${JSON.stringify(r)})'>Edit</button>
                </div>
            \`).join("");
        }

        function editRule(rule) {
            document.getElementById("editor").style.display = "block";
            document.getElementById("editor-sku").innerText = rule.sku;
            document.getElementById("rule-json").value = JSON.stringify(rule, null, 2);
        }

        async function saveRule() {
            try {
                const json = document.getElementById("rule-json").value;
                const rule = JSON.parse(json);
                const res = await fetch(API_URL + "/admin/rules/" + rule.sku, {
                    method: "PUT",
                    headers: { 
                        "content-type": "application/json",
                        "x-admin-token": getToken()
                    },
                    body: json
                });
                
                if (!res.ok) {
                    const err = await res.json();
                    return alert("Save failed: " + JSON.stringify(err, null, 2));
                }
                
                alert("Saved!");
                loadRules();
                document.getElementById("editor").style.display = "none";
            } catch (e) {
                alert("Invalid JSON");
            }
        }
    </script>
</body>
</html>
    `);
});

// --- Jobs Dashboard ---
app.get("/jobs", (_req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Jobs Dashboard</title>
  <style>
    body { font-family: sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
    h1 { margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; }
    th { background: #f5f5f5; }
    button { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
    #jobs-table tbody tr:nth-child(even) { background: #fafafa; }
    pre { white-space: pre-wrap; border: 1px solid #ddd; padding: 0.5rem; margin-top: 1rem; }
  </style>
</head>
<body>
  <h1>Jobs Dashboard</h1>
  <table id="jobs-table">
    <thead>
      <tr>
        <th>Job ID</th>
        <th>SKU</th>
        <th>Quantity</th>
        <th>Status</th>
        <th>Exports</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr><td colspan="6">Loading jobs...</td></tr>
    </tbody>
  </table>

  <h2>Job Details</h2>
  <pre id="job-details">(select a job to view details)</pre>

  <script>
    async function loadJobs() {
      try {
        const res = await fetch('/api/jobs');
        if (!res.ok) throw new Error('Failed to fetch jobs');
        const jobs = await res.json();
        const tbody = document.querySelector('#jobs-table tbody');
        tbody.innerHTML = '';
        if (!jobs.length) {
          tbody.innerHTML = '<tr><td colspan="6">No jobs found.</td></tr>';
          return;
        }
        jobs.forEach(job => {
          const exportsCount = job.exports ? job.exports.length : 0;
          const tr = document.createElement('tr');
          tr.innerHTML = \`
            <td>\${job.id}</td>
            <td>\${job.sku}</td>
            <td>\${job.quantity}</td>
            <td>\${job.status}</td>
            <td>\${exportsCount}</td>
            <td><button onclick="viewJob('\${job.id}')">View</button></td>
          \`;
          tbody.appendChild(tr);
        });
      } catch (err) {
        document.querySelector('#jobs-table tbody').innerHTML =
          '<tr><td colspan="6">Error loading jobs</td></tr>';
      }
    }

    async function viewJob(jobId) {
      try {
        const res = await fetch('/api/jobs/' + jobId);
        if (!res.ok) throw new Error('Failed to fetch job');
        const job = await res.json();
        document.querySelector('#job-details').textContent =
          JSON.stringify(job, null, 2);
      } catch (err) {
        document.querySelector('#job-details').textContent =
          'Error loading job details';
      }
    }

    // Load jobs when the page loads
    loadJobs();
  </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`);
});

