# Meshtastic → Convex Bridge Service

A Node.js service that bridges Meshtastic LoRa network position updates to a Convex database, enabling efficient real-time tracking with better battery life and data consistency.

## 🎯 Overview

This service:
- **Subscribes** to MQTT broker (`mqtt.meshtastic.org`) for Meshtastic position updates
- **Filters** and validates position packets
- **Converts** integer coordinates to decimal degrees
- **Deduplicates** redundant position updates
- **Pushes** clean data to Convex database for storage and real-time subscriptions

### Why Server-Side?

Moving MQTT connection to the server provides:
- ✅ **Better battery life** - Phone doesn't maintain constant MQTT connection
- ✅ **24/7 data capture** - Server records all updates, even when phone is offline
- ✅ **Data consistency** - Single source of truth across all clients
- ✅ **Scalability** - Multiple clients can subscribe to Convex without extra MQTT connections

## 📋 Prerequisites

- **Node.js** 18+ 
- **Convex Account** - [Sign up at convex.dev](https://convex.dev)
- **MQTT Access** - Public broker at `mqtt.meshtastic.org`

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Convex Backend

First, you need to deploy the Convex schema and mutations to your Convex project.

#### Initialize Convex (if not already done)

```bash
cd convex
npx convex dev
```

This will:
- Create a new Convex project (or link to existing)
- Deploy the schema and mutations
- Generate the `_generated` directory with API types

#### Deploy to Production

```bash
npx convex deploy
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required: Your Convex deployment URL (from Convex dashboard)
CONVEX_URL=https://your-project.convex.cloud

# Optional: Custom MQTT broker (defaults shown)
# MQTT_BROKER=mqtt://mqtt.meshtastic.org
# MQTT_TOPIC=msh/US/2/#

# Optional: Filter for specific device IDs
# DEVICE_ID_FILTER=!1234abcd,!5678efgh

# Optional: Deduplication threshold in meters
# DEDUPE_THRESHOLD_METERS=2

# Optional: Enable debug logging
# DEBUG=true
```

### 4. Run Locally

#### Development Mode (with auto-reload)

```bash
npm run dev
```

#### Production Mode

```bash
npm run build
npm start
```

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
# Build the image
docker build -t meshtastic-bridge .

# Run the container
docker run -d \
  --name meshtastic-bridge \
  --env-file .env \
  --restart unless-stopped \
  meshtastic-bridge
```

### Using Docker Compose

```bash
docker-compose up -d
```

View logs:
```bash
docker-compose logs -f
```

Stop the service:
```bash
docker-compose down
```

## ☁️ Production Deployment Options

### Option 1: Railway.app (Recommended)

Railway provides simple deployment with automatic HTTPS and monitoring.

1. **Create a Railway account** at [railway.app](https://railway.app)

2. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

3. **Login and deploy**:
   ```bash
   railway login
   railway init
   railway up
   ```

4. **Set environment variables** in Railway dashboard:
   - `CONVEX_URL` - Your Convex deployment URL
   - (Optional) Other configuration variables

5. **Deploy**: Railway will automatically build and deploy on each git push.

**Cost**: Free tier available, ~$5/month for production workloads

### Option 2: Heroku

1. **Install Heroku CLI** and login:
   ```bash
   heroku login
   ```

2. **Create app**:
   ```bash
   heroku create meshtastic-bridge
   ```

3. **Set environment variables**:
   ```bash
   heroku config:set CONVEX_URL=https://your-project.convex.cloud
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

### Option 3: DigitalOcean / VPS

1. **Provision a droplet** (Ubuntu 22.04, $6/month)

2. **SSH into server** and clone repository:
   ```bash
   git clone <your-repo-url>
   cd sync_service
   ```

3. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install dependencies and build**:
   ```bash
   npm install
   npm run build
   ```

5. **Set up as systemd service** (`/etc/systemd/system/meshtastic-bridge.service`):
   ```ini
   [Unit]
   Description=Meshtastic Convex Bridge
   After=network.target

   [Service]
   Type=simple
   User=nodejs
   WorkingDirectory=/home/nodejs/sync_service
   ExecStart=/usr/bin/node dist/service.js
   Restart=always
   RestartSec=10
   Environment=NODE_ENV=production
   EnvironmentFile=/home/nodejs/sync_service/.env

   [Install]
   WantedBy=multi-user.target
   ```

6. **Enable and start**:
   ```bash
   sudo systemctl enable meshtastic-bridge
   sudo systemctl start meshtastic-bridge
   sudo systemctl status meshtastic-bridge
   ```

## 🔧 Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CONVEX_URL` | ✅ Yes | - | Convex deployment URL |
| `MQTT_BROKER` | No | `mqtt://mqtt.meshtastic.org` | MQTT broker address |
| `MQTT_TOPIC` | No | `msh/US/2/#` | MQTT topic to subscribe to |
| `DEVICE_ID_FILTER` | No | - | Comma-separated device IDs to track |
| `DEDUPE_THRESHOLD_METERS` | No | `2` | Skip updates within N meters |
| `DEBUG` | No | `false` | Enable verbose logging |

### Device Filtering

To track only specific devices, set:
```env
DEVICE_ID_FILTER=!1234abcd,!5678efgh
```

The service will ignore position updates from other devices.

### Deduplication

The service automatically skips position updates if the device hasn't moved beyond the threshold:

```env
DEDUPE_THRESHOLD_METERS=5  # Skip if < 5 meters from last position
```

Set to `0` to disable deduplication.

## 📊 Monitoring

### Logs

The service logs all activity to stdout:

```
✓ Connected to MQTT broker: mqtt://mqtt.meshtastic.org
✓ Subscribed to topic: msh/US/2/#
📍 Position update: !1234abcd @ (37.774929, -122.419415)
✓ Logged to Convex for device: !1234abcd
```

### Debug Mode

Enable detailed logging:
```env
DEBUG=true
```

This will log raw MQTT messages for troubleshooting.

## 🗄️ Convex API

### Queries

The Convex backend provides these queries for your Expo app:

#### Get Latest Position
```typescript
import { useQuery } from "convex/react";
import { api } from "./convex/_generated/api";

const position = useQuery(api.tracker.getLatestPosition, {
  deviceId: "!1234abcd"
});
```

#### Get Position History
```typescript
const history = useQuery(api.tracker.getPositionHistory, {
  deviceId: "!1234abcd",
  startTime: Date.now() - 24 * 60 * 60 * 1000, // Last 24 hours
  limit: 100
});
```

#### Get All Devices
```typescript
const allDevices = useQuery(api.tracker.getAllLatestPositions);
```

## 🔍 Troubleshooting

### Service won't connect to MQTT

1. Check firewall rules allow outbound connections on port 1883
2. Verify `MQTT_BROKER` URL is correct
3. Test connectivity: `telnet mqtt.meshtastic.org 1883`

### No position updates appearing

1. Enable debug mode: `DEBUG=true`
2. Check if device is publishing to the correct topic
3. Verify device ID filter (if set)
4. Check Meshtastic firmware version (payload structure varies)

### Convex mutations failing

1. Verify `CONVEX_URL` is correct
2. Check Convex dashboard for deployment status
3. Ensure schema is deployed: `npx convex deploy`
4. Check Convex logs in dashboard

### TypeScript errors during build

Make sure to generate Convex types first:
```bash
cd convex
npx convex dev  # or npx convex deploy
```

This creates the `convex/_generated` directory.

## 📁 Project Structure

```
sync_service/
├── src/
│   └── service.ts          # Main bridge service
├── convex/
│   ├── schema.ts           # Database schema
│   ├── tracker.ts          # Mutations and queries
│   └── _generated/         # Auto-generated (from npx convex)
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🛠️ Development

### Build

```bash
npm run build
```

Outputs compiled JavaScript to `dist/`.

### Watch Mode

```bash
npm run watch
```

Automatically rebuilds on file changes.

### Testing MQTT Connection

You can test the MQTT connection without Convex:

```bash
npm install -g mqtt
mqtt sub -h mqtt.meshtastic.org -t 'msh/US/2/#' -v
```

## 📜 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📚 Resources

- [Meshtastic Documentation](https://meshtastic.org/)
- [Convex Documentation](https://docs.convex.dev/)
- [MQTT Protocol](https://mqtt.org/)
