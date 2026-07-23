/**
 * Placeholder "building control" values, keyed by dashboard_config_id.
 * Replace this with real calls to your BMS/energy-system backend later.
 */
const dashboards = {
  "hvac-room-101": {
    title: "Room 101 — HVAC",
    readings: { temperature_c: 21.4, humidity_pct: 45, setpoint_c: 21.0, mode: "auto" },
  },
  "hvac-room-102": {
    title: "Room 102 — HVAC",
    readings: { temperature_c: 22.1, humidity_pct: 48, setpoint_c: 22.0, mode: "auto" },
  },
  "lobby-dashboard": {
    title: "Lobby — Overview",
    readings: { temperature_c: 20.8, humidity_pct: 40, occupancy: "normal", lighting: "on" },
  },
};

function getDashboard(dashboardConfigId) {
  return dashboards[dashboardConfigId] || null;
}

module.exports = { getDashboard };
