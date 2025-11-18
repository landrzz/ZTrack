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
    brokerId: v.optional(v.string()), // Which broker this came from
  })
    .index("by_device_time", ["deviceId", "timestamp"]) // For the trail
    .index("by_time", ["timestamp"]),                   // For cleanup jobs later

  brokerConfigs: defineTable({
    name: v.string(),           // Friendly name (e.g., "My Meshtastic Network")
    broker: v.string(),         // MQTT broker address (e.g., mqtt.meshtastic.org)
    port: v.number(),           // MQTT port (default: 1883)
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    topic: v.string(),          // Root topic to subscribe (e.g., msh/US/2/#)
    nodeIds: v.optional(v.array(v.string())), // Filter for specific nodes
    enabled: v.boolean(),       // Whether this connection is active
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_enabled", ["enabled"])
    .index("by_created", ["createdAt"]),
});
