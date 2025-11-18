# Meshtastic → Convex Bridge Service Architecture

## 1. Motivation / Overview

Moving the MQTT connection to the server side is significantly better for:

- **Battery life** on the phone.
- **Data consistency** across devices.
- **Historical record-keeping**.

Instead of the phone needing to be online to “catch” the dog’s position, the server will capture every single update 24/7, and the phone simply queries the database state.

This document outlines the plan to build the **Meshtastic-to-Convex Bridge Service**.


## 2. New Architecture

The flow changes from a direct connection to a **Store and Forward** model.

**Data Flow**

- **Source:** LoRa Node → Gateway → `mqtt.meshtastic.org`
- **Bridge Service (new component):** A Node.js process that:
  - **Subscribes** to: `msh/US/2/#`
  - **Filters** only for position packets.
  - **Decodes** the coordinate math.
  - **Pushes** clean data into Convex.
- **Storage:** Convex database
  - Stores history.
  - Handles real-time subscriptions.
- **Client:** Expo App
  - Subscribes to Convex `useQuery` instead of MQTT.


## 3. Convex Setup (Backend)

Before building the bridge, we define where the data lands in Convex.

### 3.1 Schema (`convex/schema.ts`)

We will create a `positions` table.  
We should index by `deviceId` and `timestamp` for fast querying of the trail.

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  positions: defineTable({
    deviceId: v.string(),       // The Node ID (e.g., !1234abcd)
    latitude: v.number(),       // Converted float
    longitude: v.number(),      // Converted float
    altitude: v.optional(v.number()),
    accuracy: v.optional(v.number()), // Battery or GPS accuracy
    batteryLevel: v.optional(v.number()),
    timestamp: v.number(),      // Unix timestamp
    rawPayload: v.any(),        // Keep original JSON just in case
  })
    .index("by_device_time", ["deviceId", "timestamp"]) // For the trail
    .index("by_time", ["timestamp"]),                   // For cleanup jobs later
});
```

### 3.2 Mutation (`convex/tracker.ts`)

We need an API endpoint for the Bridge Service to call.

Key points:

- Implement a mutation `logPosition` (or similar).
- Use `internalMutation` or verify an API secret / token to prevent arbitrary writes.
- The mutation will:
  - Validate the payload.
  - Insert into `positions`.
  - Optionally, enforce deduplication / business rules.


## 4. Bridge Service (Node.js Worker)

MQTT requires a persistent connection (it pushes data).  
A standard Serverless function (e.g. AWS Lambda) is a bad fit because it spins down between invocations.

### 4.1 Recommended Deployment

- A small Dockerized Node.js service or background worker on:
  - Railway
  - Heroku
  - Low-cost VPS (e.g. $4–5/mo DigitalOcean droplet)

### 4.2 Tech Stack

- **Runtime:** Node.js (TypeScript)
- **MQTT Client:** `mqtt` (npm)
- **Convex Client:** `convex` (npm)
- **Config / Secrets:** `dotenv` or platform-specific env vars

### 4.3 Logic Flow

1. **Connect**
   - Establish TCP connection to `mqtt.meshtastic.org`.

2. **Subscribe**
   - Subscribe to topic: `msh/US/2/#`.

3. **Parse**
   - Incoming message is usually a JSON string.
   - Parse the JSON.
   - Check if:
     - `type === "position"`, or
     - `payload.position` / `payload.latitude_i` exists (depending on firmware).

4. **Math**
   - Apply coordinate conversion on the server, not the phone:
     - `latitude = latitude_i / 10_000_000`
     - `longitude = longitude_i / 10_000_000`

5. **Deduplicate (optional)**
   - If the dog hasn’t moved more than ~2 meters, optionally skip the write.
   - Purpose:
     - Reduce DB writes.
     - Lower costs.

6. **Ingest**
   - Call `convex.mutation(api.tracker.logPosition, { ... })` to write clean data.


## 5. Draft Bridge Implementation (`service.ts`)

Below is skeletal logic for the Bridge Service.

```ts
import mqtt from "mqtt";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";
import dotenv from "dotenv";

dotenv.config();

// 1. Configuration
const MQTT_BROKER = "mqtt://mqtt.meshtastic.org";
const MQTT_TOPIC = "msh/US/2/#";
const CONVEX_URL = process.env.CONVEX_URL!; // From your Convex dashboard

const convex = new ConvexHttpClient(CONVEX_URL);
const client = mqtt.connect(MQTT_BROKER);

client.on("connect", () => {
  console.log(`Connected to ${MQTT_BROKER}`);
  client.subscribe(MQTT_TOPIC, (err) => {
    if (!err) console.log(`Subscribed to ${MQTT_TOPIC}`);
    else console.error("Subscription error:", err);
  });
});

client.on("message", async (topic, message) => {
  try {
    // 2. Parse Meshtastic JSON
    const payloadStr = message.toString();
    const data = JSON.parse(payloadStr);

    // 3. Filter for position data (structure varies by firmware)
    if (data.type === "position" || (data.payload && data.payload.latitude_i)) {
      const pos = data.payload || data;

      // 4. Coordinate Math
      const lat = pos.latitude_i * 1e-7;
      const lon = pos.longitude_i * 1e-7;

      console.log(`Received Dog Position: ${lat}, ${lon}`);

      // 5. Send to Convex
      // Requires an API function in your Convex backend (e.g. api.tracker.logPosition)
      await convex.mutation(api.tracker.logPosition, {
        deviceId: data.from,
        latitude: lat,
        longitude: lon,
        altitude: pos.altitude,
        // TODO: use packet timestamp if available on the message payload
        timestamp: Date.now(),
      });
    }
  } catch (e) {
    console.error("Error processing message:", e);
  }
});
```

> **Note:** Once the actual Meshtastic payload shape is confirmed, we should update:
> - The `position` detection logic.
> - The timestamp field to use the device/packet timestamp instead of `Date.now()` if available.


## 6. Deployment Strategy (Simplest Path)

### 6.1 Railway.app (Recommended)

1. **Create a GitHub repo** containing:
   - This Node.js service (`service.ts`).
   - `package.json`, `tsconfig.json`, build script.
   - Dockerfile or Railway build configuration if needed.

2. **Connect Railway to GitHub**
   - Railway will detect it as a Node app and keep it running.

3. **Environment Variables**
   - Set `CONVEX_URL` (and any API secrets) in Railway environment settings.

4. **Cost**
   - Likely within free tier or ≈ $5/mo for a small always-on service.


## 7. Advantages of This Approach

- **Battery Life**
  - Phone no longer maintains a constant MQTT connection.
  - It just queries Convex when you open the app.

- **Offline History**
  - If the phone is off or offline, the server still records the dog’s path.
  - When network returns, the full trail loads instantly.

- **Security / Encapsulation**
  - The frontend no longer needs direct MQTT broker access.
  - The MQTT topic structure is hidden; the app only talks to Convex.

- **Scalability**
  - Multiple clients (web, multiple phones, dashboards) can all subscribe to the same Convex data without extra MQTT connections.
