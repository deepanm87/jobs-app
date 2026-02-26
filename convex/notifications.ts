import { ConvexError, v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"
import { getOrCreateViewerUser, getViewerUser } from "./lib/auth"

const notificationTypeValidator = v.union(
  v.literal("application_status"),
  v.literal("application_received"),
  v.literal("job_closed"),
  v.literal("system")
)

export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: notificationTypeValidator,
    title: v.string(),
    message: v.string(),
    linkUrl: v.optional(v.string()),
    metadata: v.optional(v.any())
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: Date.now()
    })
  }
})

export const listMyNotifications = query({
  args: {
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const user = await getViewerUser(ctx)
    if (!user) {
      return []
    }

    const limit = Math.max(1, Math.min(args.limit ?? 50, 200))
    if (args.unreadOnly) {
      return await ctx.db
        .query("notifications")
        .withIndex("by_userId_isRead_createdAt", q => 
          q.eq("userId", user._id).eq("isRead", false)
        )
        .order("desc")
        .take(limit)
    }

    return await ctx.db
      .query("notifications")
      .withIndex("by_userId_createdAt", q => q.eq("userId", user._id))
      .order("desc")
      .take(limit)
  }
})

export const getUnreadNotificationCount = query({
  args: {},
  handler: async ctx => {
    const user = await getViewerUser(ctx)
    if (!user) {
      return 0
    }

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead_createdAt", q => 
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect()

    return unread.length
  }
})

export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("notifications")
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateViewerUser(ctx)
    const notification = await ctx.db.get(args.notificationId)
    if (!notification || notification.userId !== user._id) {
      throw new ConvexError("Notification not found.")
    }

    const now = Date.now()
    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: now
    })

    return await ctx.db.get(args.notificationId)
  }
})

export const markAllNotificationsRead = mutation({
  args: {},
  handler: async ctx => {
    const user = await getOrCreateViewerUser(ctx)
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead_createdAt", q => 
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect()
    
    const now = Date.now()
    await Promise.all(
      unread.map(notification => 
        ctx.db.patch(notification._id, {
          isRead: true,
          readAt: now
        })
      )
    )

    return { updatedCount: unread.length }
  }
})