import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Log a position update from the Meshtastic device.
 */
export const logPosition = mutation({
  args: {
    deviceId: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    altitude: v.optional(v.number()),
    accuracy: v.optional(v.number()),
    batteryLevel: v.optional(v.number()),
    timestamp: v.number(),
    rawPayload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Validate coordinates
    if (args.latitude < -90 || args.latitude > 90) {
      throw new Error(`Invalid latitude: ${args.latitude}`);
    }
    if (args.longitude < -180 || args.longitude > 180) {
      throw new Error(`Invalid longitude: ${args.longitude}`);
    }

    // Insert the position record
    return await ctx.db.insert("positions", {
      deviceId: args.deviceId,
      latitude: args.latitude,
      longitude: args.longitude,
      altitude: args.altitude,
      accuracy: args.accuracy,
      batteryLevel: args.batteryLevel,
      timestamp: args.timestamp,
      rawPayload: args.rawPayload || {},
    });
  },
});

/**
 * Get the latest position for a device.
 */
export const getLatestPosition = query({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("positions")
      .withIndex("by_device_time", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .first();
  },
});

/**
 * Get position history.
 */
export const getHistory = query({
  args: {
    deviceId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("positions")
      .withIndex("by_device_time", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .take(args.limit ?? 100);
  },
});
