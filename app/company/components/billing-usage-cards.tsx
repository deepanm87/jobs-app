"use client"

import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/convex/_generated/api"
import { AlertTriangle, BriefcaseBusiness, Users } from "lucide-react"

export function BillingUsageCards({
  seatLimit,
  jobLimit
}: {
  seatLimit: number
  jobLimit: number
}) {
  const { orgId } = useAuth()
  const companyContext = useQuery(
    api.companies.getMyCompanyContext,
    orgId ? { clerkOrgId: orgId } : "skip"
  )
  const usage = useQuery(
    api.companies.getMyCompanyUsage,
    companyContext ? { companyId: companyContext.companyId } : "skip"
  )

  if (!orgId || companyContext === undefined || usage === undefined) {
    return (
      <div className="@container">
        <div className="grid gap-4 @md:grid-cols-2">
          <div className="h-28 animate-pulse rounded-2xl bg-secondary" />
          <div className="h-28 animate-pulse rounded-2xl bg-secondary" />
        </div>
      </div>
    )
  }

  if (!companyContext) {
    return (
      <Card className="warm-shadow">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Organization data is still syncing. Refresh in a few seconds.
        </CardContent>
      </Card>
    )
  }

  if (!usage) {
    return (
      <Card className="warm-shadow">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          You do not currently have active workspace membership in this organization.
        </CardContent>
      </Card>
    )
  }

  const seatsUsed = usage.activeMemberCount
  const jobsUsed = usage.activeJobCount

  return (
    <div className="@container">
      <div className="grid gap-4 @md:grid-cols-2">
        <UsageCard 
          icon={Users}
          label="Seats"
          used={seatsUsed}
          limit={seatLimit}
          helper={`${usage.invitedMemberCount} invited pending`}
        />
        <UsageCard 
          icon={BriefcaseBusiness}
          label="Active jobs"
          used={jobsUsed}
          limit={jobLimit}
          helper={`${usage.totalJobCount} total listings`}
        />
      </div>
    </div>
  )
}

function UsageCard({
  icon: Icon,
  label,
  used,
  limit,
  helper
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  used: number
  limit: number
  helper: string
}) {
  const ratio = Math.min(100, Math.round((used / Math.max(1, limit)) * 100))
  const overLimit = used > limit
  const nearLimit = ratio >= 80 && !overLimit

  return (
    <Card className="warm-shadow">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex size-8 items-center justify-center rounded-lg ${overLimit ? "bg-amber/10 text-amber-accent" : "bg-jade/10 text-jade"}`}>
              <Icon className="size-4" />
            </div>
            <span className="text-sm font-medium">{label}</span>
          </div>
          <span className="font-(family-name:var(--font-bricolage) text-lg font-bold">
            {used}
            <span className="text-muted-foreground">/{limit}</span>
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div 
            className={`h-2 rounded-full transition-all ${
              overLimit
                ? "bg-amber-accent"
                : nearLimit
                  ? "bg-amber-accent"
                  : "bg-jade"
            }`}
            style={{ width: `${ratio}%`}}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{helper}</p>
          {overLimit && (
            <p className="flex items-center gap-1 text-xs font-medium text-amber-accent">
              <AlertTriangle className="size-3" />
              Over Limit
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}