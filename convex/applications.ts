import { ConvexError, v } from "convex/values"
import { query, mutation } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { getViewerUser, requireViewerUser } from "./lib/auth"
import { requireActiveMembership } from "./lib/companies"

export const listMyApplications = query({
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

    const allApplications = await ctx.db
      .query("applications")
      .withIndex("by_applicantUserId_createdAt", q =>
        q.eq("applicantUserId", viewer._id)
      )
      .order("desc")
      .collect()

    const applications = allApplications.slice(skip, skip + take)

    // Fetch full job details for each application
    const applicationsWithJobs = await Promise.all(
      applications.map(async (app) => {
        const job = await ctx.db.get(app.jobId)
        return { ...app, job }
      })
    )

    return applicationsWithJobs
  },
})

export const listCompanyApplications = query({
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
      throw new ConvexError("You do not have access to this company's applications")
    }

    const take = limit ?? 50
    const skip = offset ?? 0

    const allApplications = await ctx.db
      .query("applications")
      .withIndex("by_companyId_createdAt", q => q.eq("companyId", companyId))
      .order("desc")
      .collect()

    const applications = allApplications.slice(skip, skip + take)

    // Fetch full job and applicant details
    const applicationsWithDetails = await Promise.all(
      applications.map(async (app) => {
        const job = await ctx.db.get(app.jobId)
        const applicant = await ctx.db.get(app.applicantUserId)
        return { ...app, job, applicant }
      })
    )

    return applicationsWithDetails
  },
})

export const applyToJob = mutation({
  args: {
    jobId: v.id("jobListings"),
    coverLetter: v.optional(v.string()),
    resumeId: v.optional(v.id("resumes")),
  },
  handler: async (ctx, { jobId, coverLetter, resumeId }) => {
    const viewer = await requireViewerUser(ctx)

    // Check if job exists and is active
    const job = await ctx.db.get(jobId)
    if (!job) {
      throw new ConvexError("Job listing not found")
    }

    if (!job.isActive) {
      throw new ConvexError("This job is no longer available for applications")
    }

    // Check if already applied
    const existingApplication = await ctx.db
      .query("applications")
      .withIndex("by_jobId_applicantUserId", q =>
        q.eq("jobId", jobId).eq("applicantUserId", viewer._id)
      )
      .unique()

    if (existingApplication) {
      throw new ConvexError("You have already applied to this job")
    }

    // Create application
    const applicationId = await ctx.db.insert("applications", {
      jobId,
      companyId: job.companyId,
      applicantUserId: viewer._id,
      status: "submitted",
      coverLetter,
      resumeId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Increment application count on job
    await ctx.db.patch(jobId, {
      applicationCount: job.applicationCount + 1,
      updatedAt: Date.now(),
    })

    return applicationId
  },
})

export const withdrawApplication = mutation({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, { applicationId }) => {
    const viewer = await requireViewerUser(ctx)

    const application = await ctx.db.get(applicationId)
    if (!application) {
      throw new ConvexError("Application not found")
    }

    if (application.applicantUserId !== viewer._id) {
      throw new ConvexError("You can only withdraw your own applications")
    }

    if (application.status === "withdrawn") {
      throw new ConvexError("This application has already been withdrawn")
    }

    // Update application status
    await ctx.db.patch(applicationId, {
      status: "withdrawn",
      updatedAt: Date.now(),
    })

    // Decrement application count on job
    const job = await ctx.db.get(application.jobId)
    if (job) {
      await ctx.db.patch(application.jobId, {
        applicationCount: Math.max(0, job.applicationCount - 1),
        updatedAt: Date.now(),
      })
    }

    return true
  },
})

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.union(
      v.literal("in_review"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
  },
  handler: async (ctx, { applicationId, status }) => {
    const viewer = await requireViewerUser(ctx)

    const application = await ctx.db.get(applicationId)
    if (!application) {
      throw new ConvexError("Application not found")
    }

    // Check permission
    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_companyId_userId", q =>
        q.eq("companyId", application.companyId).eq("userId", viewer._id)
      )
      .unique()

    if (!membership || membership.status !== "active") {
      throw new ConvexError("You do not have permission to update this application")
    }

    if (membership.role !== "admin" && membership.role !== "recruiter") {
      throw new ConvexError("Only admins and recruiters can update applications")
    }

    // Update application
    await ctx.db.patch(applicationId, {
      status,
      decidedByUserId: viewer._id,
      decidedAt: Date.now(),
      updatedAt: Date.now(),
    })

    // If accepted and autoCloseOnAccept is enabled, close the job
    const job = await ctx.db.get(application.jobId)
    if (job && status === "accepted" && job.autoCloseOnAccept) {
      await ctx.db.patch(application.jobId, {
        isActive: false,
        closedAt: Date.now(),
        updatedAt: Date.now(),
      })
    }

    return true
  },
})
