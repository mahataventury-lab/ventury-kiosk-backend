# ventury Kiosk Backend

A working starter implementation of the **Headwind MDM Community + FreeKiosk
room-based building-control tablet provisioning runbook**. This gives you a
real backend you can run locally, register test "rooms" against, and use to
generate the FreeKiosk config JSON files described in the runbook — all
before you touch a single physical tablet.

## What's in here

```
ventury-kiosk-backend/
├── src/
│   ├── server.js        # Express server: implements GET /kiosk (section 2)
│   ├── db.js             # SQLite kiosk_devices table (section 1)
│   ├── crypto-utils.js   # Token generation + hashing
│   └── dashboards.js     # Placeholder "building control" values per room
├── scripts/
│   ├── init-db.js        # Creates the database/table
│   ├── add-device.js     # Registers a room slot + generates its secret token
│   ├── list-devices.js   # Shows all registered devices
│   └── generate-config.js # Builds the per-device FreeKiosk config.json (section 3/6.2)
├── configs/               # Generated FreeKiosk config JSON files land here
├── .env.example           # Copy to .env
└── package.json
```

## 1. Open in VS Code

1. Download/unzip this folder somewhere on your machine.
2. In VS Code: **File → Open Folder…** and select `ventury-kiosk-backend`.
3. Open a terminal in VS Code: **Terminal → New Terminal**.

You'll need **Node.js** installed (v18+ is fine). Check with:
```bash
node -v
```
If that fails, install Node from https://nodejs.org first.

## 2. Install dependencies

In the VS Code terminal:
```bash
npm install
```

## 3. Configure your environment

```bash
cp .env.example .env
```
For local testing you can leave `.env` as-is (`BASE_URL=http://localhost:3000`).
Later, when you're ready for a real pilot, change `BASE_URL` to the real
HTTPS address of this backend — that's what gets pushed into `CUSTOM3` /
the FreeKiosk config's `baseUrl`.

## 4. Initialize the database

```bash
npm run init-db
```
This creates a local SQLite file at `data/kiosk.db` with the `kiosk_devices`
table from the runbook (section 1) — no Postgres or external DB needed for
local testing.

## 5. Register a test room

```bash
npm run add-device -- --slot building-a-floor-1-room-101 --building A --floor 1 --room 101 --dashboard hvac-room-101
```
This prints a **device token** — copy it, it's shown only once (only its
hash is stored in the DB, matching the runbook's `device_token_hash` field).

Two more rooms are already wired up with sample data in `src/dashboards.js`
if you want to try them too: `hvac-room-102` and `lobby-dashboard`.

## 6. Generate the FreeKiosk config for that room

```bash
npm run gen-config -- --slot building-a-floor-1-room-101 --token <paste-token-here>
```
This writes `configs/building-a-floor-1-room-101.config.json` — this is the
file you'd later upload as `freekiosk-config.template.json` in Headwind's
**Files** tab (runbook section 4.3), or use directly for local ADB testing
(runbook section 7).

## 7. Run the backend

```bash
npm start
```
You should see:
```
Kiosk backend listening on http://localhost:3000
```

## 8. Test it like a tablet would

Open the URL from the generated config file in your browser — it's the
`url` field, something like:
```
http://localhost:3000/kiosk?device=building-a-floor-1-room-101&token=<token>
```
You should see a dark dashboard page with the room's placeholder HVAC
readings. This is the same page a tablet's FreeKiosk WebView would load.

Try the checklist from the runbook's section 9 yourself:
- ✅ Valid device + token → shows the room dashboard
- ❌ Wrong token → "Unauthorized device" (HTTP 401)
- ❌ Unknown device slug → "Device not registered" (HTTP 404)
- Check `npm run list-devices` afterwards — `last_seen_at` should be updated

There's also a JSON variant at `/kiosk.json?device=...&token=...` if you'd
rather test with `curl` than a browser.

## Useful commands

| Command | What it does |
|---|---|
| `npm run add-device -- --slot <slot> --building <b> --floor <f> --room <r> --dashboard <id>` | Register a new room slot + generate its token |
| `npm run list-devices` | List all registered devices and their status |
| `npm run gen-config -- --slot <slot> --token <token>` | Generate that device's FreeKiosk config JSON |
| `npm start` | Run the backend |
| `npm run dev` | Run the backend with auto-restart on file changes |

## Where this fits in the runbook

This project implements:
- **Section 1** — device identity model (`kiosk_devices` table, using room
  slots instead of MAC addresses)
- **Section 2** — the `/kiosk` validation endpoint (token check, active
  check, `last_seen_at`, dashboard rendering)
- **Section 3** — the FreeKiosk config JSON template (`generate-config.js`
  builds exactly this shape)
- **Section 9** — you can run the full "Backend checks" test list against
  this locally

It does **not** yet include:
- The actual Headwind MDM setup (section 4) — that's done in the Headwind
  admin console itself, using this backend's URL and the config files this
  project generates
- The FreeKiosk fork's auto-import code (section 6) — that's Android/Kotlin
  code that lives in the FreeKiosk app project, not this backend
- Real building-control data — `src/dashboards.js` has placeholder values;
  swap in real sensor/BMS calls when you're ready

## Next steps to go from "runs on my laptop" to "pilot on real tablets"

1. Deploy this backend somewhere reachable over **HTTPS** (Headwind/FreeKiosk
   require `https://` — see the `require finalUrl.startsWith("https://")`
   check in the runbook's section 6.3).
2. Update `BASE_URL` in `.env` to that HTTPS address.
3. Register your real rooms with `add-device` and generate their configs.
4. Follow runbook sections 4 and 8 to set up Headwind and enroll 2-3 tablets
   for the pilot (section 13, Phase 2).
