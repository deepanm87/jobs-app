import { ConvexError, v } from "convex/values"
import { query, mutation } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { getViewerUser, requireViewerUser } from "./lib/auth"
import { requireActiveMembership, requireCompany } from "./lib/companies"

export const searchJobListings = query({
  args: {
    search: v.optional(v.string()),
    searchText: v.optional(v.string()),
    location: v.optional(v.string()),
    employmentType: v.optional(
      v.union(
        v.literal("full_time"),
        v.literal("part_time"),
        v.literal("contract"),
        v.literal("internship"),
        v.literal("temporary")
      )
    ),
    workplaceType: v.optional(
      v.union(
        v.literal("on_site"),
        v.literal("remote"),
        v.literal("hybrid")
      )
    ),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20
    const offset = args.offset ?? 0

    let query_handle = ctx.db
      .query("jobListings")
      .filter(q => q.eq(q.field("isActive"), true))

    if (args.employmentType) {
      query_handle = query_handle.filter(q => q.eq(q.field("employmentType"), args.employmentType))
    }

    if (args.workplaceType) {
      query_handle = query_handle.filter(q => q.eq(q.field("workplaceType"), args.workplaceType))
    }

    const allJobs = await query_handle.order("desc").collect()
    
    // Filter by search term if provided
    let filteredJobs = allJobs
    const searchTerm = (args.search || args.searchText || "").toLowerCase()
    if (searchTerm) {
      filteredJobs = allJobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm) ||
        job.searchText.toLowerCase().includes(searchTerm)
      )
    }

    return filteredJobs.slice(offset, offset + limit).map(job => ({
      _id: job._id,
      title: job.title,
      companyName: job.companyName,
      location: job.location,
      employmentType: job.employmentType,
      workplaceType: job.workplaceType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      tags: job.tags,
      featured: job.featured,
      applicationCount: job.applicationCount,
      createdAt: job.createdAt,
    }))
  },
})

export const getJobListingById = query({
  args: { jobId: v.id("jobListings") },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId)

    if (!job) {
      throw new ConvexError("Job listing not found")
    }

    const viewer = await getViewerUser(ctx)
    const canViewPrivate = viewer && job.postedByUserId === viewer._id

    if (!job.isActive && !canViewPrivate) {
      throw new ConvexError("Job listing is not available")
    }

    return job
  },
})

export const listCompanyJobs = query({
  args: {
    companyId: v.id("companies"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { companyId, limit, offset }) => {
    const viewer = await getViewerUser(ctx)

    if (!viewer) {
      return []
    }

    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_companyId_userId", q =>
        q.eq("companyId", companyId).eq("userId", viewer._id)
      )
      .unique()

    if (!membership || membership.status !== "active") {
      throw new ConvexError("You do not have access to this company's jobs")
    }

    const take = limit ?? 50
    const skip = offset ?? 0

    const allJobs = await ctx.db
      .query("jobListings")
      .withIndex("by_companyId", q => q.eq("companyId", companyId))
      .order("desc")
      .collect()

    return allJobs.slice(skip, skip + take)
  },
})

export const createJobListing = mutation({
  args: {
    companyId: v.id("companies"),
    title: v.string(),
    description: v.string(),
    location: v.string(),
    employmentType: v.union(
      v.literal("full_time"),
      v.literal("part_time"),
      v.literal("contract"),
      v.literal("internship"),
      v.literal("temporary")
    ),
    workplaceType: v.union(
      v.literal("on_site"),
      v.literal("remote"),
      v.literal("hybrid")
    ),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    salaryCurrency: v.optional(v.string()),
    tags: v.array(v.string()),
    autoCloseOnAccept: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewerUser(ctx)
    const company = await requireCompany(args.companyId, ctx)
    const membership = await requireActiveMembership(ctx, args.companyId, viewer._id)

    if (membership.role !== "admin" && membership.role !== "recruiter") {
      throw new ConvexError("Only admins and recruiters can create job listings")
    }

    const searchText = `${args.title} ${args.description} ${args.tags.join(" ")}`.toLowerCase()

    const jobId = await ctx.db.insert("jobListings", {
      companyId: args.companyId,
      companyName: company.name,
      title: args.title,
      description: args.description,
      location: args.location,
      employmentType: args.employmentType,
      workplaceType: args.workplaceType,
      salaryMin: args.salaryMin,
      salaryMax: args.salaryMax,
      salaryCurrency: args.salaryCurrency || "USD",
      tags: args.tags,
      searchText,
      isActive: true,
      featured: false,
      autoCloseOnAccept: args.autoCloseOnAccept || false,
      applicationCount: 0,
      postedByUserId: viewer._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return jobId
  },
})

export const updateJobListing = mutation({
  args: {
    jobId: v.id("jobListings"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    employmentType: v.optional(
      v.union(
        v.literal("full_time"),
        v.literal("part_time"),
        v.literal("contract"),
        v.literal("internship"),
        v.literal("temporary")
      )
    ),
    workplaceType: v.optional(
      v.union(
        v.literal("on_site"),
        v.literal("remote"),
        v.literal("hybrid")
      )
    ),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    salaryCurrency: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewerUser(ctx)
    const job = await ctx.db.get(args.jobId)

    if (!job) {
      throw new ConvexError("Job listing not found")
    }

    const membership = await requireActiveMembership(ctx, job.companyId, viewer._id)

    if (membership.role !== "admin" && membership.role !== "recruiter") {
      throw new ConvexError("Only admins and recruiters can update job listings")
    }

    const updatedData: any = {
      updatedAt: Date.now(),
    }

    if (args.title !== undefined) updatedData.title = args.title
    if (args.description !== undefined) updatedData.description = args.description
    if (args.location !== undefined) updatedData.location = args.location
    if (args.employmentType !== undefined) updatedData.employmentType = args.employmentType
    if (args.workplaceType !== undefined) updatedData.workplaceType = args.workplaceType
    if (args.salaryMin !== undefined) updatedData.salaryMin = args.salaryMin
    if (args.salaryMax !== undefined) updatedData.salaryMax = args.salaryMax
    if (args.salaryCurrency !== undefined) updatedData.salaryCurrency = args.salaryCurrency
    if (args.tags !== undefined) updatedData.tags = args.tags

    if (args.title !== undefined || args.description !== undefined || args.tags !== undefined) {
      const title = args.title ?? job.title
      const description = args.description ?? job.description
      const tags = args.tags ?? job.tags
      updatedData.searchText = `${title} ${description} ${tags.join(" ")}`.toLowerCase()
    }

    await ctx.db.patch(args.jobId, updatedData)
    return true
  },
})

export const closeJobListing = mutation({
  args: { jobId: v.id("jobListings") },
  handler: async (ctx, { jobId }) => {
    const viewer = await requireViewerUser(ctx)
    const job = await ctx.db.get(jobId)

    if (!job) {
      throw new ConvexError("Job listing not found")
    }

    const membership = await requireActiveMembership(ctx, job.companyId, viewer._id)

    if (membership.role !== "admin" && membership.role !== "recruiter") {
      throw new ConvexError("Only admins and recruiters can close job listings")
    }

    await ctx.db.patch(jobId, {
      isActive: false,
      closedAt: Date.now(),
      updatedAt: Date.now(),
    })

    return true
  },
})
