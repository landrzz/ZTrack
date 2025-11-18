import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  positions: defineTable({
    deviceId: v.string(),       // The Node ID (e.g., !9e75c710)
    latitude: v.number(),       // Converted float
    longitude: v.number(),      // Converted float
    altitude: v.optional(v.number()),
    accuracy: v.optional(v.number()), // Battery or GPS accuracy
    batteryLevel: v.optional(v.number()),
    timestamp: v.number(),      // Unix timestamp
    rawPayload: v.any(),        // Keep original JSON just in case
    brokerId: v.optional(v.id("brokerConfigs")), // Which broker config captured this position (optional for backwards compatibility)
  })
    .index("by_device_time", ["deviceId", "timestamp"]) // For the trail
    .index("by_time", ["timestamp"])                    // For cleanup jobs later
    .index("by_broker", ["brokerId"])                   // Query positions by broker
    .index("by_broker_device", ["brokerId", "deviceId"]), // Query specific device on specific broker

  brokerConfigs: defineTable({
    name: v.string(),           // Friendly name (e.g., "My Meshtastic Network")
    broker: v.string(),         // MQTT broker address (e.g., mqtt.meshtastic.org)
    port: v.number(),           // MQTT port (default: 1883)
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    topic: v.string(),          // Root topic to subscribe (e.g., msh/US/2/#)
    nodeIds: v.optional(v.array(v.string())), // Filter for specific nodes
    enabled: v.boolean(),       // Whether this connection is active
    userId: v.optional(v.string()), // FUTURE: User who owns this broker config (for multi-user support)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_enabled", ["enabled"])
    .index("by_created", ["createdAt"])
    .index("by_user", ["userId"]),  // Query brokers by user (for future multi-user)
});
