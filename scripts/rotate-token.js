/**
 * Usage:
 *   npm run rotate-token -- --slot building-a-floor-1-room-101
 *
 * Rotates the token for an existing device by generating a new random token,
 * hashing it, and updating the stored hash in the database.
 */
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
const slot = typeof args.slot === "string" ? args.slot.trim() : args.slot;

if (!slot) {
  console.error("Missing required --slot <device_slot>");
  console.error(
    "Example: npm run rotate-token -- --slot building-a-floor-1-room-101"
  );
  process.exit(1);
}

const existing = db.prepare("SELECT device_slot FROM kiosk_devices WHERE device_slot = ?").get(slot);
if (!existing) {
  console.error(`No device found for slot '${slot}'.`);
  process.exit(1);
}

const token = generateToken();
const tokenHash = hashToken(token);
const result = db
  .prepare("UPDATE kiosk_devices SET device_token_hash = ? WHERE device_slot = ?")
  .run(tokenHash, slot);

if (result.changes !== 1) {
  console.error(`Failed to rotate token for slot '${slot}'.`);
  process.exit(1);
}

console.log(`Token rotated for device '${slot}'.\n`);
console.log("New device token (SAVE THIS NOW, shown only once):");
console.log(`  ${token}\n`);
console.log("Use it in the FreeKiosk config or kiosk URL.");
