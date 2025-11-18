# Multi-Broker Setup Guide

## Quick Start

### 1. Deploy Convex Schema

First, deploy the updated schema with broker configuration support:

```bash
# From sync_service directory
npx convex dev
```

This will:
- Deploy the new `brokerConfigs` table
- Deploy the broker management API (`brokers.ts`)
- Generate updated TypeScript types

### 2. Configure Admin UI

Edit `admin/index.html` and replace the Convex URL:

```javascript
const CONVEX_URL = "YOUR_CONVEX_URL_HERE"; // Line ~260
```

Replace with your actual Convex URL (found in `.env` or `.env.local`):
```javascript
const CONVEX_URL = "https://utmost-porcupine-898.convex.cloud";
```

### 3. Open Admin UI

Open `admin/index.html` in your browser:

```bash
open admin/index.html
```

### 4. Add Your First Broker

In the admin UI, add your Meshtastic broker with these details:

**Based on your screenshot:**
- **Connection Name:** My Meshtastic
- **Broker Address:** mqtt.meshtastic.org
- **Port:** 1883
- **Username:** _(if required by your setup)_
- **Password:** _(if required)_
- **Topic:** `msh/US/2/2/json/LandersOnly/!9e75c710`
- **Node IDs:** `!9e75c710` _(your node from screenshot)_

Click "Add Broker Connection"

### 5. Start the Service

```bash
npm run dev
```

The service will:
- Connect to Convex
- Load enabled broker configurations
- Connect to each MQTT broker
- Start logging position data

## How It Works

### Architecture

```
┌─────────────────┐
│  Admin UI       │  ← Configure brokers via web interface
└────────┬────────┘
         │
         ├→ Convex Database (stores broker configs)
         │
┌────────┴────────┐
│  Bridge Service │  ← Reads configs, manages MQTT connections
└────────┬────────┘
         │
         ├→ MQTT Broker 1 (your Meshtastic)
         ├→ MQTT Broker 2 (future)
         └→ MQTT Broker N (scalable)
```

### Payload Parsing

The service now correctly parses the Meshtastic JSON structure from your screenshot:

```json
{
  "payload": {
    "altitude": 113,
    "latitude_i": 352052802,   ← Converted to 35.2052802
    "longitude_i": -79255229,  ← Converted to -7.9255229
    "precision_bits": 32
  },
  "sender": "!9e75c710",
  "type": "position"
}
```

## Configuration Options

### Broker Configuration

Each broker can have:
- **Name:** Friendly identifier
- **Broker/Port:** MQTT server details
- **Credentials:** Optional username/password
- **Topic:** MQTT topic pattern (supports `#` wildcard)
- **Node IDs:** Filter specific devices (leave empty for all)
- **Enabled:** Toggle connection on/off

### Multiple Brokers

You can configure multiple brokers:
- Different Meshtastic networks
- Public and private brokers
- Regional servers
- Each tracked independently

### Auto-Sync

The service polls Convex every 30 seconds for configuration changes:
- Add/remove brokers without restarting
- Enable/disable connections on the fly
- Update filters in real-time

## Monitoring

### Service Logs

The service outputs structured logs:

```
🚀 Meshtastic Multi-Broker Service started
🔌 Connecting to broker: My Meshtastic
   URL: mqtt://mqtt.meshtastic.org:1883
   Topic: msh/US/2/2/json/LandersOnly/!9e75c710
✓ Connected to My Meshtastic
✓ Subscribed to msh/US/2/2/json/LandersOnly/!9e75c710
📍 [My Meshtastic] Position: !9e75c710 @ (35.205280, -7.925523)
✓ Logged to Convex
```

### Convex Dashboard

View data in real-time:
1. Visit https://dashboard.convex.dev
2. Check `positions` table for location data
3. Check `brokerConfigs` table for active configurations

## Troubleshooting

### "Cannot find module '../convex/_generated/api'"

Run `npx convex dev` to regenerate API types.

### Connection Refused

Check:
- Broker address is correct
- Port is correct (usually 1883)
- Firewall allows outbound connections
- Credentials are valid (if required)

### No Position Data

1. Enable debug logging in admin UI
2. Check topic matches your device's publish topic
3. Verify node ID filter (if set)
4. Check Meshtastic device is publishing

### Admin UI Not Loading Brokers

1. Verify `CONVEX_URL` in `admin/index.html`
2. Check browser console for errors
3. Ensure Convex deployment is active

## Production Deployment

### Environment Variables

Create `.env` in production:
```env
CONVEX_URL=https://your-production-deployment.convex.cloud
```

### Docker Deployment

```bash
docker build -t meshtastic-bridge .
docker run -d \
  --name meshtastic-bridge \
  --env-file .env \
  --restart unless-stopped \
  meshtastic-bridge
```

### Railway/Heroku

Set environment variable:
```
CONVEX_URL=your_convex_url
```

The service will auto-sync configurations from Convex.

## Next Steps

1. ✅ Add your first broker via admin UI
2. ✅ Start the service: `npm run dev`
3. ✅ Watch logs for position updates
4. ✅ Check Convex dashboard for data
5. 🔄 Add more brokers as needed

## Future Enhancements

- [ ] Authentication for admin UI
- [ ] Webhook notifications on position updates
- [ ] Historical data export
- [ ] Geofencing alerts
- [ ] Battery level monitoring
- [ ] Connection health dashboard
