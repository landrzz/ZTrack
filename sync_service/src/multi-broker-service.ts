import mqtt, { MqttClient } from "mqtt";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const CONVEX_URL = process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("ERROR: CONVEX_URL environment variable is required");
  process.exit(1);
}

// Initialize Convex client
const convex = new ConvexHttpClient(CONVEX_URL);

// Store active MQTT connections
const activeConnections = new Map<string, MqttClient>();

// Store last known positions for deduplication
const lastPositions = new Map<string, { lat: number; lon: number; timestamp: number }>();

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if position should be deduplicated
 */
function shouldDeduplicate(deviceId: string, lat: number, lon: number, threshold: number = 2): boolean {
  const last = lastPositions.get(deviceId);
  if (!last) return false;

  const distance = haversineDistance(last.lat, last.lon, lat, lon);
  return distance < threshold;
}

/**
 * Parse Meshtastic MQTT payload
 * Based on actual structure from screenshot
 */
function parseMeshtasticPayload(data: any) {
  // Check if this is a position packet
  if (data.type !== "position") {
    return null;
  }

  // Extract payload (contains lat/lon)
  if (!data.payload || !data.payload.latitude_i || !data.payload.longitude_i) {
    return null;
  }

  // Convert integer coordinates to decimal degrees
  const latitude = data.payload.latitude_i * 1e-7;
  const longitude = data.payload.longitude_i * 1e-7;

  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return {
    deviceId: data.sender || data.from?.toString() || "unknown",
    latitude,
    longitude,
    altitude: data.payload.altitude,
    accuracy: data.payload.precision_bits,
    timestamp: data.timestamp ? data.timestamp * 1000 : Date.now(), // Convert to ms if needed
  };
}

/**
 * Connect to an MQTT broker
 */
function connectToBroker(config: any) {
  const brokerId = config._id;
  const brokerUrl = `mqtt://${config.broker}:${config.port}`;

  console.log(`\n🔌 Connecting to broker: ${config.name}`);
  console.log(`   URL: ${brokerUrl}`);
  console.log(`   Topic: ${config.topic}`);

  const options: any = {
    clientId: `meshtastic-bridge-${config.name.replace(/\s+/g, '-')}-${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 5000,
  };

  // Add credentials if provided
  if (config.username) {
    options.username = config.username;
  }
  if (config.password) {
    options.password = config.password;
  }

  const client = mqtt.connect(brokerUrl, options);

  client.on("connect", () => {
    console.log(`✓ Connected to ${config.name}`);
    client.subscribe(config.topic, (err) => {
      if (err) {
        console.error(`✗ Subscription error for ${config.name}:`, err);
      } else {
        console.log(`✓ Subscribed to ${config.topic}`);
        if (config.nodeIds && config.nodeIds.length > 0) {
          console.log(`  Filtering for nodes: ${config.nodeIds.join(", ")}`);
        }
      }
    });
  });

  client.on("reconnect", () => {
    console.log(`⟳ Reconnecting to ${config.name}...`);
  });

  client.on("error", (err) => {
    console.error(`✗ MQTT error for ${config.name}:`, err.message);
  });

  client.on("offline", () => {
    console.log(`⚠ ${config.name} offline`);
  });

  client.on("message", async (topic, message) => {
    try {
      const payloadStr = message.toString();
      const data = JSON.parse(payloadStr);

      // Parse using the actual Meshtastic structure
      const parsed = parseMeshtasticPayload(data);
      if (!parsed) {
        return; // Skip non-position or invalid packets
      }

      // Apply node filter if configured
      if (config.nodeIds && config.nodeIds.length > 0) {
        if (!config.nodeIds.includes(parsed.deviceId)) {
          return; // Skip nodes not in filter list
        }
      }

      // Check for deduplication
      if (shouldDeduplicate(parsed.deviceId, parsed.latitude, parsed.longitude)) {
        console.log(`⊘ Skipping duplicate position for ${parsed.deviceId}`);
        return;
      }

      console.log(
        `📍 [${config.name}] Position: ${parsed.deviceId} @ (${parsed.latitude.toFixed(6)}, ${parsed.longitude.toFixed(6)})`
      );

      // Send to Convex
      await convex.mutation(api.positions.logPosition, {
        deviceId: parsed.deviceId,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        altitude: parsed.altitude,
        accuracy: parsed.accuracy,
        timestamp: parsed.timestamp,
        rawPayload: data,
      });

      // Update last known position
      lastPositions.set(parsed.deviceId, {
        lat: parsed.latitude,
        lon: parsed.longitude,
        timestamp: parsed.timestamp,
      });

      console.log(`✓ Logged to Convex`);
    } catch (error) {
      console.error(`✗ Error processing message from ${config.name}:`, error);
    }
  });

  activeConnections.set(brokerId, client);
  return client;
}

/**
 * Disconnect from a broker
 */
function disconnectBroker(brokerId: string) {
  const client = activeConnections.get(brokerId);
  if (client) {
    client.end();
    activeConnections.delete(brokerId);
    console.log(`✗ Disconnected broker: ${brokerId}`);
  }
}

/**
 * Load and sync broker configurations from Convex
 */
async function syncBrokerConfigurations() {
  try {
    const enabledBrokers = await convex.query(api.brokers.getEnabledBrokers);
    
    // Track which brokers should be active
    const shouldBeActive = new Set(enabledBrokers.map((b: any) => b._id));

    // Disconnect brokers that are no longer enabled
    for (const [brokerId] of activeConnections) {
      if (!shouldBeActive.has(brokerId)) {
        disconnectBroker(brokerId);
      }
    }

    // Connect to new or reconnect to existing enabled brokers
    for (const broker of enabledBrokers) {
      if (!activeConnections.has(broker._id)) {
        // Need full config with password
        const fullConfig = await convex.query(api.brokers.getBrokerWithPassword, {
          id: broker._id,
        });
        if (fullConfig) {
          connectToBroker(fullConfig);
        }
      }
    }
  } catch (error) {
    console.error("✗ Error syncing broker configurations:", error);
  }
}

/**
 * Start the multi-broker service
 */
async function start() {
  console.log("🚀 Meshtastic Multi-Broker Service started");
  console.log(`   Convex URL: ${CONVEX_URL}`);
  console.log("");

  // Initial load
  await syncBrokerConfigurations();

  // Poll for configuration changes every 30 seconds
  setInterval(syncBrokerConfigurations, 30000);

  console.log("\n✓ Service is running. Press Ctrl+C to stop.");
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n⚠ Shutting down gracefully...");
  for (const [brokerId, client] of activeConnections) {
    client.end();
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n⚠ Shutting down gracefully...");
  for (const [brokerId, client] of activeConnections) {
    client.end();
  }
  process.exit(0);
});

// Start the service
start().catch((error) => {
  console.error("✗ Fatal error:", error);
  process.exit(1);
});
