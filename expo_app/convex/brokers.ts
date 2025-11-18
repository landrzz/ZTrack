import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new broker configuration
 */
export const createBroker = mutation({
  args: {
    name: v.string(),
    broker: v.string(),
    port: v.number(),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    topic: v.string(),
    nodeIds: v.optional(v.array(v.string())),
    enabled: v.optional(v.boolean()),
    userId: v.optional(v.string()), // FUTURE: For multi-user support
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("brokerConfigs", {
      name: args.name,
      broker: args.broker,
      port: args.port,
      username: args.username,
      password: args.password,
      topic: args.topic,
      nodeIds: args.nodeIds,
      enabled: args.enabled ?? true,
      userId: args.userId, // Store userId for future multi-user filtering
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing broker configuration
 */
export const updateBroker = mutation({
  args: {
    id: v.id("brokerConfigs"),
    name: v.optional(v.string()),
    broker: v.optional(v.string()),
    port: v.optional(v.number()),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    topic: v.optional(v.string()),
    nodeIds: v.optional(v.array(v.string())),
    enabled: v.optional(v.boolean()),
    userId: v.optional(v.string()), // FUTURE: For multi-user support
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return id;
  },
});

/**
 * Delete a broker configuration
 */
export const deleteBroker = mutation({
  args: { id: v.id("brokerConfigs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Get all broker configurations
 */
export const listBrokers = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("brokerConfigs")
      .order("desc")
      .collect();
  },
});

/**
 * Get only enabled broker configurations
 */
export const getEnabledBrokers = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("brokerConfigs")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .collect();
  },
});

/**
 * Get a specific broker configuration (without password)
 */
export const getBroker = query({
  args: { id: v.id("brokerConfigs") },
  handler: async (ctx, args) => {
    const broker = await ctx.db.get(args.id);
    if (!broker) return null;
    
    // Don't expose password in queries
    const { password, ...safeConfig } = broker;
    return safeConfig;
  },
});

/**
 * Get full broker config (including password) - for internal use by service
 * This should be protected in production
 */
export const getBrokerWithPassword = query({
  args: { id: v.id("brokerConfigs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get broker configurations for a specific user
 * FUTURE: For multi-user support
 */
export const getBrokersByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("brokerConfigs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
