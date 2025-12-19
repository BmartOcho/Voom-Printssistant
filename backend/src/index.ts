import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { z } from "zod";
import { JsonDb } from "./storage.js";
import { ExportRecord, ExportPayloadSchema, ProductRule, ProductRuleSchema } from "@printssistant/shared";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT ?? 8787);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";
const DATA_DIR = process.env.DATA_DIR ?? "./data";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "secret123";

const db = new JsonDb(DATA_DIR);

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

  db.addExport(rec);
  res.json({ ok: true, record: rec });
});

app.get("/api/exports", (req, res) => {
  const limit = Number(req.query.limit ?? 50);
  res.json(db.listExports(Number.isFinite(limit) ? limit : 50));
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

app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`);
});

