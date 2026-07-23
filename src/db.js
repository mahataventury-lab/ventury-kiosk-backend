const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
require("dotenv").config();

const DB_PATH = process.env.DB_PATH || "./data/kiosk.db";
const resolvedPath = path.resolve(process.cwd(), DB_PATH);

// Make sure the folder for the db file exists
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const db = new Database(resolvedPath);
db.pragma("journal_mode = WAL");

// Mirrors the kiosk_devices table from the runbook (section 1),
// using SQLite-compatible types (TEXT for uuid/timestamp, INTEGER for booleans).
db.exec(`
  CREATE TABLE IF NOT EXISTS kiosk_devices (
    id TEXT PRIMARY KEY,
    device_slot TEXT UNIQUE NOT NULL,
    device_token_hash TEXT NOT NULL,
    building TEXT,
    floor TEXT,
    room TEXT,
    dashboard_config_id TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    last_seen_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
