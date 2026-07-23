/**
 * Usage:
 *   npm run gen-config -- --slot building-a-floor-1-room-101 --token <raw_token>
 *
 * Writes configs/<slot>.config.json — this is the file you upload to Headwind's
 * "Files" tab (runbook section 4.3), and is what CUSTOM1/CUSTOM2/CUSTOM3 + variable
 * content would otherwise be substituted into.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("../src/db");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      args[key] = value;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

// Trim every string arg defensively — stray leading/trailing spaces from
// copy-paste are the most common cause of "Device not registered" later.
for (const key of Object.keys(args)) {
  if (typeof args[key] === "string") args[key] = args[key].trim();
}

if (!args.slot || !args.token) {
  console.error("Usage: npm run gen-config -- --slot <device_slot> --token <raw_token>");
  process.exit(1);
}

const row = db.prepare("SELECT * FROM kiosk_devices WHERE device_slot = ?").get(args.slot);
if (!row) {
  console.error(`No device found with slot '${args.slot}'. Run add-device first.`);
  process.exit(1);
}

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const url = `${baseUrl}/kiosk?device=${encodeURIComponent(args.slot)}&token=${encodeURIComponent(args.token)}`;

const config = {
  configVersion: 1,
  deviceSlot: args.slot,
  deviceToken: args.token,
  baseUrl,
  url,
  pin: args.pin || "1234",
  kioskEnabled: true,
  autoStart: true,
  autoRelaunch: true,
  statusBar: false,
  fullscreen: true,
};

const outDir = path.resolve(process.cwd(), "configs");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${args.slot}.config.json`);
fs.writeFileSync(outPath, JSON.stringify(config, null, 2) + "\n");

console.log(`Config written to ${outPath}`);
console.log("Upload this file's content as freekiosk-config.template.json in Headwind,");
console.log("or use it directly for local ADB testing (see runbook section 7).");
