import mqtt, { MqttClient } from "mqtt";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import dotenv from "dotenv";
import * as Protobuf from "@meshtastic/protobufs";

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
 * Only deduplicate if:
 * 1. Position is within distanceThreshold meters (default 10m)
 * 2. AND less than timeThreshold seconds have passed (default 5 minutes)
 * This ensures fresh updates even when stationary, while avoiding spam
 */
function shouldDeduplicate(
  deviceId: string, 
  lat: number, 
  lon: number, 
  timestamp: number,
  distanceThreshold: number = 2,
  timeThreshold: number = 60 // 1 minute in seconds
): boolean {
  const last = lastPositions.get(deviceId);
  if (!last) return false;

  const distance = haversineDistance(last.lat, last.lon, lat, lon);
  const timeDiff = timestamp - last.timestamp;
  
  // Only deduplicate if BOTH conditions are true:
  // - Position is very close (< 10m)
  // - AND update is very recent (< 5 minutes)
  return distance < distanceThreshold && timeDiff < timeThreshold;
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
      let parsed: any;

      // Check if this is a JSON message (topic contains '/json/')
      if (topic.includes('/json/')) {
        // Parse JSON message
        try {
          const payloadStr = message.toString();
          const data = JSON.parse(payloadStr);
          
          // Check if this is a position packet
          if (data.type !== 'position') {
            return; // Skip non-position packets
          }

          // Extract position data from JSON
          if (!data.payload?.latitude_i || !data.payload?.longitude_i) {
            return; // Skip if no valid position
          }

          // Convert from Meshtastic integer format to decimal degrees
          const latitude = data.payload.latitude_i * 1e-7;
          const longitude = data.payload.longitude_i * 1e-7;

          parsed = {
            deviceId: data.sender || 'unknown',
            latitude,
            longitude,
            altitude: data.payload.altitude || undefined,
            timestamp: data.payload.time || data.timestamp || Math.floor(Date.now() / 1000),
            batteryLevel: undefined,
            accuracy: data.payload.precision_bits || undefined,
            rawPayload: data,
          };
        } catch (jsonError) {
          // Silently skip malformed JSON messages
          return;
        }
      } else {
        // Try to parse as protobuf message
        try {
          const envelope = Protobuf.Mesh.ServiceEnvelope.decode(message);
          
          // Check if this is a position packet
          if (!envelope.packet?.decoded?.portnum || envelope.packet.decoded.portnum !== Protobuf.Portnums.PortNum.POSITION_APP) {
            return; // Skip non-position packets
          }

          // Decode the position data
          const positionData = Protobuf.Mesh.Position.decode(envelope.packet.decoded.payload);
          
          // Convert from Meshtastic format (integers) to standard lat/lon
          const latitude = positionData.latitudeI ? positionData.latitudeI * 1e-7 : null;
          const longitude = positionData.longitudeI ? positionData.longitudeI * 1e-7 : null;
          
          if (!latitude || !longitude) {
            return; // Skip if no valid position
          }

          // Get device ID from the packet
          const deviceId = envelope.packet.from ? `!${envelope.packet.from.toString(16)}` : 'unknown';
          
          parsed = {
            deviceId,
            latitude,
            longitude,
            altitude: positionData.altitude || undefined,
            timestamp: positionData.time || Math.floor(Date.now() / 1000),
            batteryLevel: undefined,
            accuracy: positionData.precisionBits || undefined,
            rawPayload: envelope,
          };
        } catch (protobufError) {
          // Silently skip messages that aren't valid protobuf
          return;
        }
      }

      if (!parsed) {
        return; // Skip if parsing failed
      }

      // Apply node filter if configured
      if (config.nodeIds && config.nodeIds.length > 0) {
        if (!config.nodeIds.includes(parsed.deviceId)) {
          return; // Skip nodes not in filter list
        }
      }

      // Check for deduplication (only skip if position is close AND time is recent)
      if (shouldDeduplicate(parsed.deviceId, parsed.latitude, parsed.longitude, parsed.timestamp)) {
        console.log(`⊘ Skipping duplicate position for ${parsed.deviceId} (within 10m and < 5min)`);
        return;
      }

      console.log(
        `📍 [${config.name}] Position: ${parsed.deviceId} @ (${parsed.latitude.toFixed(6)}, ${parsed.longitude.toFixed(6)})`
      );

      // Send to Convex with broker ID to track which broker captured this position
      await convex.mutation(api.positions.logPosition, {
        deviceId: parsed.deviceId,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        altitude: parsed.altitude,
        accuracy: parsed.accuracy,
        timestamp: parsed.timestamp,
        rawPayload: parsed.rawPayload,
        brokerId: brokerId, // Track which broker config captured this position
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
