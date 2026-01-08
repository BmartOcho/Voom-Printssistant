import "dotenv/config";
import express from "express";
import session from "express-session";
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
  JobCreateSchema,
  CanvaFolder,
  CanvaTemplate
} from "@printssistant/shared";
import crypto from "node:crypto";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import {
  generateAuthUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  generateState,
  generatePKCEPair,
  isTokenExpired,
  type TokenData,
  type CanvaAuthConfig,
} from "./canva-auth.js";
import { CanvaApiClient, filterPublicDesigns, type CanvaDesignWithSharing } from "./canva-api.js";
import { TokenStorage } from "./token-storage.js";

const PORT = Number(process.env.PORT ?? 8787);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";
const DATA_DIR = process.env.DATA_DIR ?? "./data";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "secret123";

// Canva OAuth Configuration
const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID ?? "";
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET ?? "";
const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI ?? "http://localhost:8787/auth/callback";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "change-me-in-production";
const TOKEN_ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY ?? "change-me-in-production-32chars";

const db = new JsonDb(DATA_DIR);
const tokenStorage = new TokenStorage(DATA_DIR, TOKEN_ENCRYPTION_KEY);

const canvaAuthConfig: CanvaAuthConfig = {
  clientId: CANVA_CLIENT_ID,
  clientSecret: CANVA_CLIENT_SECRET,
  redirectUri: CANVA_REDIRECT_URI,
};

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

/**
 * Get or refresh Canva API client for the organization account
 */
async function getCanvaClient(): Promise<CanvaApiClient | null> {
  const tokenData = tokenStorage.getToken("organization");
  
  if (!tokenData) {
    return null;
  }

  // Check if token is expired and refresh if needed
  if (isTokenExpired(tokenData)) {
    try {
      const newTokenData = await refreshAccessToken(canvaAuthConfig, tokenData.refreshToken);
      tokenStorage.updateToken("organization", newTokenData);
      
      return new CanvaApiClient({
        accessToken: newTokenData.accessToken,
        onTokenRefresh: async () => {
          const refreshed = await refreshAccessToken(canvaAuthConfig, newTokenData.refreshToken);
          tokenStorage.updateToken("organization", refreshed);
          return refreshed.accessToken;
        },
      });
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return null;
    }
  }

  return new CanvaApiClient({
    accessToken: tokenData.accessToken,
    onTokenRefresh: async () => {
      const refreshed = await refreshAccessToken(canvaAuthConfig, tokenData.refreshToken);
      tokenStorage.updateToken("organization", refreshed);
      return refreshed.accessToken;
    },
  });
}

const app = express();

// Session middleware (must come before routes that use sessions)
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

app.use(cors({ origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN }));
app.use(express.json({ limit: "10mb" }));

// --- Public API ---

app.get("/health", (_req, res) => res.json({ ok: true }));

// --- OAuth Authentication ---

/**
 * Initiate OAuth flow with Canva
 */
app.get("/auth/canva", (req, res) => {
  if (!CANVA_CLIENT_ID || !CANVA_CLIENT_SECRET) {
    return res.status(500).json({
      error: "Canva OAuth not configured. Please set CANVA_CLIENT_ID and CANVA_CLIENT_SECRET.",
    });
  }

  const state = generateState();
  const { codeVerifier, codeChallenge } = generatePKCEPair();
  
  // Store state and code_verifier in session for later use
  if (req.session) {
    (req.session as any).oauthState = state;
    (req.session as any).codeVerifier = codeVerifier;
  }

  const authUrl = generateAuthUrl(canvaAuthConfig, state, codeChallenge);
  res.redirect(authUrl);
});

/**
 * OAuth callback handler
 */
app.get("/auth/callback", async (req, res) => {
  const { code, state } = req.query;

  // Verify state to prevent CSRF
  const sessionState = req.session ? (req.session as any).oauthState : null;
  if (!state || state !== sessionState) {
    return res.status(400).json({ error: "Invalid state parameter" });
  }

  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
  }

  try {
    // Retrieve code_verifier from session
    const codeVerifier = req.session ? (req.session as any).codeVerifier : null;
    if (!codeVerifier) {
      return res.status(400).json({ error: "Missing code_verifier. Please restart OAuth flow." });
    }

    // Exchange code for tokens (with PKCE)
    const tokenData = await exchangeCodeForToken(canvaAuthConfig, code as string, codeVerifier);
    
    // Store tokens for the organization (single shared account)
    tokenStorage.storeToken("organization", tokenData);
    
    // Clear OAuth state from session
    if (req.session) {
      delete (req.session as any).oauthState;
      delete (req.session as any).codeVerifier;
    }

    // Redirect to success page or close window
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Successful</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; }
          .success { color: #22c55e; font-size: 24px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="success">✓ Successfully connected to Canva!</div>
        <p>You can close this window and return to the app.</p>
        <script>
          // Try to close the window (works if opened as popup)
          setTimeout(() => window.close(), 2000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).json({
      error: "Failed to complete authentication",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Check authentication status (for organization account)
 */
app.get("/auth/status", (req, res) => {
  const tokenData = tokenStorage.getToken("organization");
  
  if (!tokenData) {
    return res.json({
      authenticated: false,
      message: "Organization not authenticated. Admin must complete OAuth setup.",
    });
  }

  res.json({
    authenticated: true,
    userId: tokenData.userId,
    expiresAt: tokenData.expiresAt,
    isExpired: isTokenExpired(tokenData),
  });
});

/**
 * Logout and clear tokens
 */
app.post("/auth/logout", (req, res) => {
  const userId = req.session ? (req.session as any).userId : null;
  
  if (userId && tokenStorage.hasToken(userId)) {
    tokenStorage.deleteToken(userId);
  }

  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
      }
    });
  }

  res.json({ ok: true, message: "Logged out successfully" });
});


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

// --- Folders & Templates API ---

// List organization folders
app.get("/api/folders", async (req, res) => {
  try {
    // Get Canva API client (uses organization token)
    const client = await getCanvaClient();
    
    if (!client) {
      return res.status(503).json({
        error: "Service not configured",
        message: "Organization Canva account not authenticated. Contact administrator.",
      });
    }

    // Fetch folders from Canva API
    const canvaFolders = await client.listFolders();
    
    // Transform to our format
    const folders: CanvaFolder[] = canvaFolders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      itemCount: 0, // We'll need to query each folder to get accurate count
      description: `Updated ${folder.updated_at ? new Date(folder.updated_at).toLocaleDateString() : "recently"}`,
    }));

    res.json(folders);
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({
      error: "Failed to fetch folders",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Test endpoint: List brand templates (organization-wide templates)  
app.get("/api/brand-templates", async (req, res) => {
  try {
    const client = await getCanvaClient();
    
    if (!client) {
      return res.status(503).json({
        error: "Service not configured",
        message: "Organization Canva account not authenticated. Contact administrator.",
      });
    }

    const templates = await client.listBrandTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Error fetching brand templates:", error);
    res.status(500).json({
      error: "Failed to fetch brand templates",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});


// List templates in a specific folder (only "Everyone with a link")
app.get("/api/folders/:folderId/templates", async (req, res) => {
  try {
    const { folderId } = req.params;
    
    // Get Canva API client (uses organization token)
    const client = await getCanvaClient();
    
    if (!client) {
      return res.status(503).json({
        error: "Service not configured",
        message: "Organization Canva account not authenticated. Contact administrator.",
      });
    }

    // Fetch designs from folder
    const designs = await client.listFolderDesigns(folderId);
    
    // Filter to only include publicly shared designs
    console.log(`Filtering ${designs.length} designs for public sharing...`);
    const publicDesigns = await filterPublicDesigns(client, designs);
    console.log(`Found ${publicDesigns.length} publicly shared designs`);
    
    // Transform to our CanvaTemplate format
    const templates: CanvaTemplate[] = publicDesigns.map((design) => ({
      id: design.id,
      name: design.title,
      folderId,
      thumbnailUrl: design.thumbnail?.url,
      widthPx: design.width,
      heightPx: design.height,
      createdAt: design.created_at,
      updatedAt: design.updated_at,
    }));

    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({
      error: "Failed to fetch templates",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Copy a template (with public sharing verification)
app.post("/api/templates/:templateId/copy", async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Get Canva API client (uses organization token)
    const client = await getCanvaClient();
    
    if (!client) {
      return res.status(503).json({
        error: "Service not configured",
        message: "Organization Canva account not authenticated. Contact administrator.",
      });
    }


    // Brand templates are organization-wide, so create from template instead of copying
    console.log(`Creating design from brand template: ${templateId}`);
    const result = await client.createFromBrandTemplate(templateId);
    
    res.json({
      success: true,
      designId: result.designId,
      editUrl: result.editUrl,
      originalTemplateId: templateId,
      message: "Template copied successfully",
    });
  } catch (error) {
    console.error("Failed to copy template:", error);
    res.status(500).json({
      error: "Failed to copy template",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
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

