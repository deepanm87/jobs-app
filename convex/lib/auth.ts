import { ConvexError } from "convex/values"
import type { Doc } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"

type Ctx = QueryCtx | MutationCtx

export async function requireIdentity(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new ConvexError("You must be signed in to perform this action.")
  }
  return identity
}

export async function getViewerUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    return null
  }
  return await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", q => q.eq("clerkUserId", identity.subject))
    .unique()
}

export async function requireViewerUser(ctx: Ctx): Promise<Doc<"users">> {
  const user = await getViewerUser(ctx)
  if (!user) {
    throw new ConvexError("User profile is not initialized yet. Complete profile setup first.")
  }
  return user
}

export async function getOrCreateViewerUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await requireIdentity(ctx)
  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", q => q.eq("clerkUserId", identity.subject))
    .unique()

  if (existing) {
    return existing
  }

  const now = Date.now()
  const userId = await ctx.db.insert("users", {
    clerkUserId: identity.subject,
    email: identity.email ?? undefined,
    firstName: identity.givenName ?? undefined,
    lastName: identity.familyName ?? undefined,
    imageUrl: identity.pictureUrl ?? undefined,
    createdAt: now,
    updatedAt: now
  })

  const created = await ctx.db.get(userId)
  if (!created) {
    throw new ConvexError("Failed to create user record.")
  }

  return created
}