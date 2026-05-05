import { ConvexError, v } from "convex/values"
import { query, mutation } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { getViewerUser, requireViewerUser } from "./lib/auth"

export const listMyFavorites = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerUser(ctx)

    if (!viewer) {
      return []
    }

    const take = args.limit ?? 50
    const skip = args.offset ?? 0

    const allFavorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", q => q.eq("userId", viewer._id))
      .order("desc")
      .collect()

    const favorites = allFavorites.slice(skip, skip + take)

    // Fetch full job details for each favorite
    const favoritesWithJobs = await Promise.all(
      favorites.map(async (fav) => {
        const job = await ctx.db.get(fav.jobId)
        return {
          _id: fav._id,
          jobId: fav.jobId,
          createdAt: fav.createdAt,
          job,
        }
      })
    )

    return favoritesWithJobs.filter(f => f.job && f.job.isActive)
  },
})

export const isJobFavorited = query({
  args: { jobId: v.id("jobListings") },
  handler: async (ctx, { jobId }) => {
    const viewer = await getViewerUser(ctx)

    if (!viewer) {
      return false
    }

    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_userId_jobId", q =>
        q.eq("userId", viewer._id).eq("jobId", jobId)
      )
      .unique()

    return !!favorite
  },
})

export const addFavorite = mutation({
  args: { jobId: v.id("jobListings") },
  handler: async (ctx, { jobId }) => {
    const viewer = await requireViewerUser(ctx)

    // Check if job exists and is active
    const job = await ctx.db.get(jobId)
    if (!job) {
      throw new ConvexError("Job listing not found")
    }

    if (!job.isActive) {
      throw new ConvexError("This job is no longer available")
    }

    // Check if already favorited
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_userId_jobId", q =>
        q.eq("userId", viewer._id).eq("jobId", jobId)
      )
      .unique()

    if (existing) {
      return existing._id
    }

    // Add to favorites
    const favoriteId = await ctx.db.insert("favorites", {
      userId: viewer._id,
      jobId,
      createdAt: Date.now(),
    })

    return favoriteId
  },
})

export const removeFavorite = mutation({
  args: { jobId: v.id("jobListings") },
  handler: async (ctx, { jobId }) => {
    const viewer = await requireViewerUser(ctx)

    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_userId_jobId", q =>
        q.eq("userId", viewer._id).eq("jobId", jobId)
      )
      .unique()

    if (!favorite) {
      throw new ConvexError("This job is not in your favorites")
    }

    await ctx.db.delete(favorite._id)
    return true
  },
})
