# Command Reference

## Essential Commands

### Start the Bridge Service
```bash
npm run dev
```
Starts the multi-broker service in development mode with auto-reload.

### Open Admin UI
```bash
open admin/index.html
```
Opens the broker configuration interface in your browser.

### Deploy Convex Changes
```bash
npx convex dev
```
Deploys schema and function updates to Convex (auto-generates types).

---

## Development Commands

### Build TypeScript
```bash
npm run build
```
Compiles TypeScript to JavaScript in `dist/` folder.

### Watch Mode
```bash
npm run watch
```
Continuously compiles TypeScript on file changes.

### Run Single Broker (Legacy)
```bash
npm run dev:single
```
Runs the original single-broker service (uses `.env` config).

---

## Production Commands

### Start Production Build
```bash
npm run build
npm start
```
Runs the compiled multi-broker service.

### Deploy Convex to Production
```bash
npx convex deploy
```
Deploys to production Convex deployment.

---

## Configuration Locations

### Environment Variables
- `.env` - Main service config (CONVEX_URL)
- `.env.local` - Convex deployment config (auto-generated)

### Broker Configs
- **Via Admin UI:** `admin/index.html` (recommended)
- **In Convex:** Dashboard → Data → `brokerConfigs` table

### Position Data
- **Convex Dashboard:** https://dashboard.convex.dev/d/utmost-porcupine-898
- **Table:** `positions`

---

## Typical Workflow

### Initial Setup
```bash
# 1. Deploy Convex
npx convex dev

# 2. Open admin UI
open admin/index.html

# 3. Add broker via UI
# (fill in form with your MQTT details)

# 4. Start service
npm run dev
```

### Daily Use
```bash
# Just start the service - configs are in Convex
npm run dev
```

### Adding New Broker
1. Open `admin/index.html` in browser
2. Fill in the form
3. Click "Add Broker Connection"
4. Service auto-syncs within 30 seconds (no restart needed!)

### Disabling a Broker
1. Open admin UI
2. Click "⏸ Disable" on the broker
3. Service disconnects within 30 seconds

---

## Useful Paths

| File | Purpose |
|------|---------|
| `admin/index.html` | Web UI for broker management |
| `src/multi-broker-service.ts` | Main service (multi-broker) |
| `convex/brokers.ts` | Broker config API |
| `convex/positions.ts` | Position logging API |
| `convex/schema.ts` | Database schema |
| `QUICKSTART.md` | Getting started guide |
| `SETUP.md` | Detailed documentation |

---

## Troubleshooting Commands

### Check Convex deployment
```bash
npx convex dev
# Look for "Convex functions ready!"
```

### Verify Convex URL
```bash
cat .env
cat .env.local
```

### Test MQTT connectivity
```bash
# Install mosquitto client
brew install mosquitto

# Subscribe to test topic
mosquitto_sub -h mqtt.meshtastic.org -t 'msh/US/2/#' -v
```

### Clear Convex cache
```bash
rm -rf .convex
npx convex dev
```

### View service logs
The service outputs to stdout - just watch the terminal where `npm run dev` is running.

---

## Quick Reference

**Add broker:** Admin UI → Fill form → Add  
**Start service:** `npm run dev`  
**Deploy Convex:** `npx convex dev`  
**View data:** https://dashboard.convex.dev  
**Stop service:** `Ctrl+C`  
