import { ConvexError, v } from "convex/values"
import { query, mutation } from "../_generated/server"
import type { Doc, Id } from "../_generated/dataModel"
import type { QueryCtx, MutationCtx } from "../_generated/server"

import { getViewerUser, requireViewerUser } from "./auth"

// our helpers are usable in both query and mutation contexts
type Ctx = QueryCtx | MutationCtx
// narrow the role type from the document schema so callers can reuse it
export type CompanyRole = Doc<"companyMembers">["role"]

export async function requireCompany(companyId: Id<"companies">, ctx: Ctx) {
  const company = await ctx.db.get(companyId)

  if (!company) {
    throw new ConvexError("Company was not found.")
  }
  return company
}

export async function requireActiveMembership(
  ctx: Ctx,
  companyId: Id<"companies">,
  userId: Id<"users">
) {
  const membership = await ctx.db
    .query("companyMembers")
    .withIndex("by_companyId_userId", q =>
      q.eq("companyId", companyId).eq("userId", userId)
    )
    .unique()

  if (!membership || membership.status !== "active") {
    throw new ConvexError("You do not have access to this company workspace.")
  }
  return membership
}

// --- public queries / mutations ------------------------------------------------

export const getMyCompanyContext = query({
  args: {
    clerkOrgId: v.string(),
  },
  handler: async (ctx, { clerkOrgId }) => {
    const viewer = await getViewerUser(ctx)
    if (!viewer) {
      return null
    }
    const company = await ctx.db
      .query("companies")
      .withIndex("by_clerkOrgId", q => q.eq("clerkOrgId", clerkOrgId))
      .unique()
    if (!company) return null

    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_companyId_userId", q =>
        q.eq("companyId", company._id).eq("userId", viewer._id)
      )
      .unique()

    return {
      companyId: company._id,
      companyName: company.name,
      role: membership?.role ?? "member",
      seatLimit: company.seatLimit,
      jobLimit: company.jobLimit,
    }
  },
})

export const getCompanyUsage = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }) => {
    const members = await ctx.db
      .query("companyMembers")
      .withIndex("by_companyId_userId", q => q.eq("companyId", companyId))
      .collect()

    const activeMemberCount = members.filter(m => m.status === "active").length
    const invitedMemberCount = members.filter(m => m.status !== "active").length

    // jobs table may not be present in schema, so we treat results as any
    let activeJobCount = 0
    let totalJobCount = 0
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allJobs = (await ctx.db.query(("jobs" as unknown) as any).collect()) as unknown[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const companyJobs = allJobs.filter((j: any) => j.companyId === companyId)
      totalJobCount = companyJobs.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activeJobCount = companyJobs.filter((j: any) => j.isActive).length
    } catch {
      // silent fallback if table/index doesn't exist
    }

    return { activeMemberCount, invitedMemberCount, activeJobCount, totalJobCount }
  },
})

export const getMyCompanyUsage = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    // ensure viewer is an active member before giving usage
    const viewer = await requireViewerUser(ctx)
    await requireActiveMembership(ctx, args.companyId, viewer._id)
    // replicate same logic as getCompanyUsage
    const members = await ctx.db
      .query("companyMembers")
      .withIndex("by_companyId_userId", q => q.eq("companyId", args.companyId))
      .collect()

    const activeMemberCount = members.filter(m => m.status === "active").length
    const invitedMemberCount = members.filter(m => m.status !== "active").length

    let activeJobCount = 0
    let totalJobCount = 0
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allJobs = (await ctx.db.query(("jobs" as unknown) as any).collect()) as unknown[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const companyJobs = allJobs.filter((j: any) => j.companyId === args.companyId)
      totalJobCount = companyJobs.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activeJobCount = companyJobs.filter((j: any) => j.isActive).length
    } catch {
      // ignore missing table/index
    }

    return { activeMemberCount, invitedMemberCount, activeJobCount, totalJobCount }
  },
})

export const syncCompanyPlan = mutation({
  args: {
    clerkOrgId: v.string(),
    plan: v.union(v.literal("free"), v.literal("starter"), v.literal("growth")),
    seatLimit: v.number(),
    jobLimit: v.number(),
  },
  handler: async (ctx, args) => {
    // update or create a company record tied to the Clerk org
    const now = Date.now()
    const company = await ctx.db
      .query("companies")
      .withIndex("by_clerkOrgId", q => q.eq("clerkOrgId", args.clerkOrgId))
      .unique()

    if (company) {
      await ctx.db.patch(company._id, {
        plan: args.plan,
        seatLimit: args.seatLimit,
        jobLimit: args.jobLimit,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("companies", {
        clerkOrgId: args.clerkOrgId,
        name: "", // name can be filled in separately if desired
        plan: args.plan,
        seatLimit: args.seatLimit,
        jobLimit: args.jobLimit,
        createdAt: now,
        updatedAt: now,
      })
    }
  },
})

export async function requireCompanyRole(
  ctx: Ctx,
  companyId: Id<"companies">,
  userId: Id<"users">,
  allowedRoles: CompanyRole[]
) {
  const membership = await requireActiveMembership(ctx, companyId, userId)
  if (!allowedRoles.includes(membership.role)) {
    throw new ConvexError("Insufficient company role permissions.")
  }
  return membership
}