import mqtt from "mqtt";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://mqtt.meshtastic.org";
const MQTT_TOPIC = process.env.MQTT_TOPIC || "msh/US/2/#";
const CONVEX_URL = process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("ERROR: CONVEX_URL environment variable is required");
  process.exit(1);
}

// Optional: Device ID filter (comma-separated list)
const DEVICE_ID_FILTER = process.env.DEVICE_ID_FILTER?.split(",").map(id => id.trim());

// Optional: Deduplication threshold in meters (default: 2 meters)
const DEDUPE_THRESHOLD_METERS = parseFloat(process.env.DEDUPE_THRESHOLD_METERS || "2");

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
function shouldDeduplicate(deviceId: string, lat: number, lon: number): boolean {
  const last = lastPositions.get(deviceId);
  if (!last) return false;

  const distance = haversineDistance(last.lat, last.lon, lat, lon);
  return distance < DEDUPE_THRESHOLD_METERS;
}

// Initialize Convex client
const convex = new ConvexHttpClient(CONVEX_URL);

// Connect to MQTT broker
const client = mqtt.connect(MQTT_BROKER, {
  clientId: `meshtastic-bridge-${Math.random().toString(16).slice(2, 8)}`,
  clean: true,
  reconnectPeriod: 5000,
});

client.on("connect", () => {
  console.log(`✓ Connected to MQTT broker: ${MQTT_BROKER}`);
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error("✗ Subscription error:", err);
    } else {
      console.log(`✓ Subscribed to topic: ${MQTT_TOPIC}`);
      if (DEVICE_ID_FILTER) {
        console.log(`  Filtering for devices: ${DEVICE_ID_FILTER.join(", ")}`);
      }
      if (DEDUPE_THRESHOLD_METERS > 0) {
        console.log(`  Deduplication threshold: ${DEDUPE_THRESHOLD_METERS}m`);
      }
    }
  });
});

client.on("reconnect", () => {
  console.log("⟳ Reconnecting to MQTT broker...");
});

client.on("error", (err) => {
  console.error("✗ MQTT client error:", err);
});

client.on("offline", () => {
  console.log("⚠ MQTT client offline");
});

client.on("message", async (topic, message) => {
  try {
    // Parse the incoming message
    const payloadStr = message.toString();
    const data = JSON.parse(payloadStr);

    // Log raw message for debugging (can be disabled in production)
    if (process.env.DEBUG === "true") {
      console.log(`[DEBUG] Received message on ${topic}:`, JSON.stringify(data, null, 2));
    }

    // Check if this is a position packet
    // Meshtastic firmware can vary in structure, so we check multiple patterns
    const isPositionPacket =
      data.type === "position" ||
      (data.payload && data.payload.latitude_i) ||
      (data.decoded && data.decoded.position);

    if (!isPositionPacket) {
      return; // Skip non-position packets
    }

    // Extract position data from various possible structures
    const pos = data.payload || data.decoded?.position || data;

    // Ensure we have latitude_i and longitude_i
    if (pos.latitude_i === undefined || pos.longitude_i === undefined) {
      console.warn("⚠ Position packet missing latitude_i/longitude_i:", data);
      return;
    }

    // Extract device ID from various possible fields
    const deviceId =
      data.from ||
      data.sender ||
      data.decoded?.from ||
      pos.deviceId ||
      "unknown";

    // Apply device filter if configured
    if (DEVICE_ID_FILTER && !DEVICE_ID_FILTER.includes(deviceId)) {
      return; // Skip devices not in filter list
    }

    // Convert integer coordinates to decimal degrees
    const latitude = pos.latitude_i * 1e-7;
    const longitude = pos.longitude_i * 1e-7;

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      console.warn(`⚠ Invalid coordinates: lat=${latitude}, lon=${longitude}`);
      return;
    }

    // Check for deduplication
    if (shouldDeduplicate(deviceId, latitude, longitude)) {
      console.log(`⊘ Skipping duplicate position for ${deviceId} (< ${DEDUPE_THRESHOLD_METERS}m)`);
      return;
    }

    // Extract timestamp (prefer packet timestamp over current time)
    const timestamp =
      pos.timestamp || pos.time || data.timestamp || Date.now();

    // Extract optional fields
    const altitude = pos.altitude !== undefined ? pos.altitude : undefined;
    const batteryLevel =
      pos.batteryLevel !== undefined
        ? pos.batteryLevel
        : data.decoded?.user?.batteryLevel;
    const accuracy = pos.PDOP || pos.accuracy;

    console.log(
      `📍 Position update: ${deviceId} @ (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
    );

    // Send to Convex
    await convex.mutation(api.positions.logPosition, {
      deviceId,
      latitude,
      longitude,
      altitude,
      accuracy,
      batteryLevel,
      timestamp,
      rawPayload: data,
    });

    // Update last known position for deduplication
    lastPositions.set(deviceId, { lat: latitude, lon: longitude, timestamp });

    console.log(`✓ Logged to Convex for device: ${deviceId}`);
  } catch (error) {
    console.error("✗ Error processing message:", error);
    if (error instanceof Error) {
      console.error("  Stack:", error.stack);
    }
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n⚠ Shutting down gracefully...");
  client.end();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n⚠ Shutting down gracefully...");
  client.end();
  process.exit(0);
});

console.log("🚀 Meshtastic-Convex Bridge Service started");
console.log(`   MQTT Broker: ${MQTT_BROKER}`);
console.log(`   MQTT Topic: ${MQTT_TOPIC}`);
console.log(`   Convex URL: ${CONVEX_URL}`);
