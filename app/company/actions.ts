"use server"

import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs/server"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"

export type InviteMemberResult = 
  | { success: true }
  | { 
      success: false
      error: string
  }

export async function inviteOrganizationMember(
  emailAddress: string,
  role: string,
  appOrigin?: string
): Promise<InviteMemberResult> {
  const { orgId, userId, has, getToken } = await auth()

  if (!orgId || !userId) {
    return {
      success: false,
      error: "You must be signed in and have an organization selected."
    }
  }

  const canInvite = has({ permission: "org:team_management:invite" })
  if (!canInvite) {
    return {
      success: false,
      error: "You do not have permission to invite members."
    }
  }

  const email = emailAddress?.trim()
  if (!email) {
    return {
      success: false,
      error: "Email address is required."
    }
  }

  const token = (await getToken({ template: "convex" })) ?? undefined
  const companyContext = await fetchQuery(
    api.companies.getMyCompanyContext,
    { clerkOrgId: orgId },
    { token }
  )

  if (!companyContext) {
    return {
      success: false,
      error: "Company not found. Try refreshing."
    }
  }

  const usage = await fetchQuery(
    api.companies.getCompanyUsage,
    { companyId: companyContext.companyId },
    { token }
  )

  if (!usage) {
    return {
      success: false,
      error: "Could not load usage. Try again."
    }
  }

  const seatLimit = companyContext.seatLimit ?? 1
  const currentCount = usage.activeMemberCount + usage.invitedMemberCount
  if (currentCount >= seatLimit) {
    return {
      success: false,
      error: `Seat limit reached (${currentCount}/${seatLimit}). Upgrade your plan to invite more members.`
    }
  }

  try {
    const clerk = await clerkClient()
    const redirectUrl = 
      appOrigin && /^https?:\/\//.test(appOrigin)
        ? `${appOrigin.replace(/\/$/, "")}/company`
        : undefined

    await clerk.organizations.createOrganizationInvitation({
      organizationId: orgId,
      inviterUserId: userId,
      emailAddress: email,
      role: role || "org:member",
      ...(redirectUrl && { redirectUrl })
    })
    return { success: true }
  } catch (err) {
    const message = 
      err instanceof Error ? err.message : "Failed to send invitation."
    return {
      success: false,
      error: message
    }
  }
}