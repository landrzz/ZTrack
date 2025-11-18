# 🚀 Quick Start - Multi-Broker Configuration

## What Changed?

Your bridge service now supports **multiple MQTT brokers** configured via a web UI!

### New Features
✅ **Multi-broker support** - Connect to multiple Meshtastic networks  
✅ **Web-based configuration** - No more editing .env files  
✅ **Correct payload parsing** - Handles actual Meshtastic JSON structure  
✅ **Node filtering** - Track specific devices (like your `!9e75c710`)  
✅ **Hot reload** - Add/remove brokers without restarting  

---

## Get Started in 3 Steps

### Step 1: Open Admin UI

```bash
open admin/index.html
```

### Step 2: Add Your Broker

Fill in the form with your details from the screenshot:

| Field | Value |
|-------|-------|
| **Connection Name** | `My Meshtastic` |
| **Broker Address** | `mqtt.meshtastic.org` |
| **Port** | `1883` |
| **Username** | _(leave empty or add if required)_ |
| **Password** | _(leave empty or add if required)_ |
| **Topic** | `msh/US/2/2/json/LandersOnly/!9e75c710` |
| **Node IDs** | `!9e75c710` |

Click **"Add Broker Connection"**

### Step 3: Start the Service

```bash
npm run dev
```

You should see:
```
🚀 Meshtastic Multi-Broker Service started
🔌 Connecting to broker: My Meshtastic
✓ Connected to My Meshtastic
✓ Subscribed to msh/US/2/2/json/LandersOnly/!9e75c710
```

---

## What the Service Does

### Parses Your Meshtastic Payload

From your screenshot:
```json
{
  "payload": {
    "latitude_i": 352052802,   → Converts to 35.2052802
    "longitude_i": -79255229,  → Converts to -7.9255229
    "altitude": 113
  },
  "sender": "!9e75c710",
  "type": "position"
}
```

### Stores in Convex

Check your dashboard: https://dashboard.convex.dev/d/utmost-porcupine-898

You'll see:
- `positions` table - Location history
- `brokerConfigs` table - Your MQTT connections

---

## Managing Brokers

### Via Admin UI

**Add Broker:** Fill form → Click "Add Broker Connection"  
**Disable Broker:** Click "⏸ Disable" button  
**Enable Broker:** Click "▶️ Enable" button  
**Delete Broker:** Click "🗑 Delete" button  

The service auto-syncs every 30 seconds - no restart needed!

### Multiple Brokers

Want to track multiple networks? Just add more:
- Your personal Meshtastic network
- A friend's network
- Regional public channels
- Different topic patterns

Each broker can have its own:
- MQTT server and credentials
- Topic subscription
- Node ID filters
- Enable/disable state

---

## Monitoring

### Service Logs

When a position arrives:
```
📍 [My Meshtastic] Position: !9e75c710 @ (35.205280, -7.925523)
✓ Logged to Convex
```

### Convex Dashboard

Real-time data view:
1. Visit https://dashboard.convex.dev/d/utmost-porcupine-898
2. Click "Data" tab
3. Select `positions` table
4. Watch live updates!

---

## Troubleshooting

### Service won't connect?

1. **Check broker address** - Is `mqtt.meshtastic.org` reachable?
2. **Check credentials** - Does it require username/password?
3. **Check topic** - Does it match your device's publish topic?

### No position data?

1. **Check node filter** - Is `!9e75c710` correct?
2. **Check device** - Is it publishing to MQTT?
3. **Check topic pattern** - Try using `#` wildcard: `msh/US/2/#`

### Admin UI not working?

1. **Check browser console** (F12)
2. **Verify Convex URL** - Should be in the HTML file
3. **Clear browser cache** and refresh

---

## Files Reference

```
sync_service/
├── admin/
│   └── index.html          ← Admin web UI (open this!)
├── src/
│   ├── service.ts          ← Old single-broker (legacy)
│   └── multi-broker-service.ts  ← New multi-broker (default)
├── convex/
│   ├── schema.ts           ← Database tables
│   ├── positions.ts        ← Position tracking API
│   └── brokers.ts          ← Broker config API
├── package.json            ← Now runs multi-broker by default
├── SETUP.md                ← Detailed documentation
└── QUICKSTART.md           ← This file!
```

---

## Next Steps

1. ✅ Open admin UI: `open admin/index.html`
2. ✅ Add your broker configuration
3. ✅ Start service: `npm run dev`
4. ✅ Watch the magic happen! 🎉

For detailed docs, see `SETUP.md`
