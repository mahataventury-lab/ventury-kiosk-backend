require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./db");
const { hashToken, safeEqual } = require("./crypto-utils");
const { getDashboard } = require("./dashboards");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

/**
 * GET /kiosk?device=<device_slot>&token=<device_token>
 *
 * Implements the backend behavior from runbook section 2:
 * 1. Read device and token
 * 2. Find device_slot in kiosk_devices
 * 3. Hash token, compare to device_token_hash
 * 4. Check is_active
 * 5. Update last_seen_at
 * 6. Load dashboard_config_id
 * 7. Render the room-specific dashboard
 */
app.get("/kiosk", (req, res) => {
  const device = typeof req.query.device === "string" ? req.query.device.trim() : req.query.device;
  const token = typeof req.query.token === "string" ? req.query.token.trim() : req.query.token;

  if (!device || !token) {
    return res.status(400).send(renderMessage("Missing device or token parameter."));
  }

  const row = db
    .prepare("SELECT * FROM kiosk_devices WHERE device_slot = ?")
    .get(device);

  if (!row) {
    return res.status(404).send(renderMessage("Device not registered."));
  }

  const incomingHash = hashToken(token);
  if (!safeEqual(incomingHash, row.device_token_hash)) {
    return res.status(401).send(renderMessage("Unauthorized device."));
  }

  if (!row.is_active) {
    return res.status(403).send(renderMessage("Device disabled."));
  }

  db.prepare(
    "UPDATE kiosk_devices SET last_seen_at = datetime('now') WHERE device_slot = ?"
  ).run(device);

  const dashboard = getDashboard(row.dashboard_config_id);
  if (!dashboard) {
    return res
      .status(500)
      .send(renderMessage(`No dashboard configured for '${row.dashboard_config_id}'.`));
  }

  return res.send(renderDashboard(row, dashboard));
});

// Simple JSON variant, handy for curl/testing without opening a browser.
app.get("/kiosk.json", (req, res) => {
  const device = typeof req.query.device === "string" ? req.query.device.trim() : req.query.device;
  const token = typeof req.query.token === "string" ? req.query.token.trim() : req.query.token;
  if (!device || !token) {
    return res.status(400).json({ error: "missing_params" });
  }
  const row = db.prepare("SELECT * FROM kiosk_devices WHERE device_slot = ?").get(device);
  if (!row) return res.status(404).json({ error: "device_not_registered" });

  const incomingHash = hashToken(token);
  if (!safeEqual(incomingHash, row.device_token_hash)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!row.is_active) return res.status(403).json({ error: "device_disabled" });

  db.prepare(
    "UPDATE kiosk_devices SET last_seen_at = datetime('now') WHERE device_slot = ?"
  ).run(device);

  const dashboard = getDashboard(row.dashboard_config_id);
  if (!dashboard) return res.status(500).json({ error: "no_dashboard_config" });

  return res.json({ device: row.device_slot, dashboard });
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

function renderMessage(text) {
  return `<!doctype html><html><body style="font-family:sans-serif;text-align:center;margin-top:20vh;">
    <h1>${escapeHtml(text)}</h1>
  </body></html>`;
}

function renderDashboard(row, dashboard) {
  const rows = Object.entries(dashboard.readings)
    .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(String(v))}</td></tr>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8">
    <title>${escapeHtml(dashboard.title)}</title>
    <style>
      body{font-family:sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:4vh 6vw;}
      h1{color:#60a5fa;}
      table{width:100%;border-collapse:collapse;margin-top:2rem;}
      td{padding:0.75rem 1rem;border-bottom:1px solid #334155;font-size:1.2rem;}
      td:first-child{color:#94a3b8;text-transform:uppercase;font-size:0.9rem;}
    </style>
  </head><body>
    <h1>${escapeHtml(dashboard.title)}</h1>
    <p>Device slot: <code>${escapeHtml(row.device_slot)}</code></p>
    <table>${rows}</table>
  </body></html>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

app.listen(PORT, () => {
  console.log(`Kiosk backend listening on http://localhost:${PORT}`);
  console.log(`Try:  http://localhost:${PORT}/kiosk?device=<slot>&token=<token>`);
});
