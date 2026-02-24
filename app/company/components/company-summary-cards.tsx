"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { BriefcaseBusiness, Building2, FileText, Users } from "lucide-react"

export function CompanySummaryCards({ orgId }: { orgId: string }) {
  const companyContext = useQuery(api.companies.getMyCompanyContext, { clerkOrg: orgId })
  const jobs = useQuery(
    api.jobs.listCompanyJobs,
    companyContext ? { companyId: companyContext.companyId, includeClosed: true, limit: 200 } : "skip"
  )
  const applications = useQuery(
    api.applications.listCompanyApplications,
    companyContext ? { companyId: companyContext.companyId, limit: 400 } : "skip"
  )

  if (companyContext === undefined || jobs === undefined || applications === undefined) {
    return (
      <div className="@container">
        <div className="grid gap-4 @sm:grid-cols-2 @3xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      </div>
    )
  }

  if (!companyContext) {
    return (
      <Card className="warm-shadow">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Your organization data is still syncing. Refresh in a few seconds.
        </CardContent>
      </Card>
    )
  }

  const activeJobs = jobs.filter(job => job.isActive).length
  const submitted = applications.filter(application => application.status === "submitted").length
  const inReview = applications.filter(application => application.status === "in_review").length

  const metrics = [
    { icon: Building2, label: "Organization", value: companyContext.companyName, color: "bg-terracotta/10 text-terracotta" },
    { icon: Users, label: "Your role", value: companyContext.role, color: "bg-jade/10 text-jade" },
    { icon: BriefcaseBusiness, label: "Active jobs", value: String(activeJobs), color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
    { icon: FileText, label: "Pipeline", value: `${submitted} new · ${inReview} reviewing`, color: "bg-amber-accent/10 text-amber-accent"}
  ]

  return (
    <div className="@container">
      <div className="grid gap-4 @sm:grid-cols-2 @3xl:grid-cols-4">
        {metrics.map(metric => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="warm-shadow">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${metric.color}`}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="truncate font-(family-name:var(--font-bricolage) text-sm font-semibold capitalize">
                    {metric.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}