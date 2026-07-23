const db = require("../src/db");

const rows = db
  .prepare(
    "SELECT device_slot, building, floor, room, dashboard_config_id, is_active, last_seen_at FROM kiosk_devices ORDER BY device_slot"
  )
  .all();

if (rows.length === 0) {
  console.log("No devices registered yet. Use: npm run add-device -- --slot <slot> ...");
} else {
  console.table(rows);
}
