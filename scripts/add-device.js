/**
 * Usage:
 *   npm run add-device -- --slot building-a-floor-1-room-101 --building A --floor 1 --room 101 --dashboard hvac-room-101
 *
 * Prints the raw device token ONCE. Store it securely — only its hash is kept in the DB.
 */
const crypto = require("crypto");
const db = require("../src/db");
const { generateToken, hashToken } = require("../src/crypto-utils");

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

if (!args.slot) {
  console.error("Missing required --slot <device_slot>");
  console.error(
    "Example: npm run add-device -- --slot building-a-floor-1-room-101 --building A --floor 1 --room 101 --dashboard hvac-room-101"
  );
  process.exit(1);
}

const token = generateToken();
const tokenHash = hashToken(token);
const id = crypto.randomUUID();

try {
  db.prepare(
    `INSERT INTO kiosk_devices (id, device_slot, device_token_hash, building, floor, room, dashboard_config_id, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
  ).run(
    id,
    args.slot,
    tokenHash,
    args.building || null,
    args.floor || null,
    args.room || null,
    args.dashboard || null
  );
} catch (err) {
  if (String(err).includes("UNIQUE constraint failed")) {
    console.error(`A device with slot '${args.slot}' already exists.`);
    process.exit(1);
  }
  throw err;
}

console.log("Device registered.\n");
console.log(`  device_slot: ${args.slot}`);
console.log(`  device_token (SAVE THIS NOW, shown only once):`);
console.log(`    ${token}\n`);
console.log("Next step: generate its FreeKiosk config file with:");
console.log(`  npm run gen-config -- --slot ${args.slot} --token ${token}`);
