import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),

  users: defineTable({
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerkUserId", ["clerkUserId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("application_status"),
      v.literal("application_received"),
      v.literal("job_closed"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    linkUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
    isRead: v.boolean(),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_userId_isRead_createdAt", ["userId", "isRead", "createdAt"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),
});
