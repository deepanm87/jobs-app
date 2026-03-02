"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { getErrorMessage } from "@/lib/convex-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  MapPin,
  Search,
  XCircle
} from "lucide-react"
import { formatSalary } from "@/lib/format-salary"

const statusConfig: Record<string, { 
  label: string
  className: string
}> = {
  submitted: { label: "Submitted", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800" },
  in_review: { label: "In review", className: "bg-amber-accent/10 text-amber-accent border-amber-accent/20" },
  accepted: { label: "Accepted", className: "bg-jade/10 text-jade border-jade/20" },
  rejected: { label: "Not selected", className: "bg-destructive/10 text-destructive border-destructive/20" },
  withdrawn: { label: "Withdrawn", className: "border-border text-muted-foreground" }
}

export default function ApplicationsPage() {
  const applications = useQuery(api.applications.listMyApplications, { limit: 100 })
  const withdrawApplication = useMutation(api.applications.withdrawApplication)
  const [statusText, setStatusText] = useState<string | null>(null)
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      }
      else {
        next.add(id)
      }
      return next
    })
  }

  const sorted = applications
    ? [...applications].sort((a, b) => {
        if (a.status === "withdrawn" && b.status !== "withdrawn") {
          return 1
        }
        if (a.status !== "withdrawn" && b.status === "withdrawn") {
          return -1
        }
        return 0
      })
    : undefined

  return (
    <section className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-(family-name:--font-bricolage) text-2xl font-bold tracking-tight">
          Your applications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track every role you&apos;ve applied to and see where things stand.
        </p>
      </div>

      {statusText && (
        <p className="text-xs text-muted-foreground">{statusText}</p>
      )}

      {applications === undefined && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      )}

      {sorted?.length === 0 && (
        <Card className="warm-shadow">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <p className="font-medium">No applications yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              You haven&apos;t applied to any jobs. Browse openings to find your next opportunity.
            </p>
            <Button asChild className="mt-2 rounded-full bg-jade text-white hover:bg-jade/90">
              <Link href="/jobs">
                <Search className="mr-1.5 size-3.5" />
                Browse jobs
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {sorted?.map((application, index) => {
          const config = statusConfig[application.status] ?? statusConfig.submitted
          const isExpanded = expandedIds.has(application.id)
          const isWithdrawn = application.status === "withdrawn"
          const canWithdraw = application.status === "submitted" || application.status === "in_review"
          const job = application.job

          return (
            <Card
              key={application._id}
              className={`@container animate-slide-up warm-shadow overflow-hidden transition-all hover:warm-shadow-md ${isWithdrawn ? "opacity-50" : ""}`}
              style={{ animationDelay: `${index * 0.04}s `}}
            >
              <div
                className="flex cursor-pointer items-center gap-3 p-4 @sm:gap-4 @sm:p-5"
                onClick={() => toggleExpanded(application._id)}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <Briefcase className="size-4 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-(family-name:--font-bricolage) font-semibold tracking-tight">
                    {job?.title ?? "Job unavailable"}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="size-3" />
                    {job?.companyName ?? "Unknown company"}
                    <span className="text-border">·</span>
                    <MapPin className="size-3" />
                    {job?.location ?? "_"}
                  </p>
                </div>

                <div className="flex items-center gap-2 @sm:gap-3">
                  <span className="hidden text-xs text-muted-foreground @sm:block">
                    {new Date(application.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <Badge
                    variant="outline"
                    className={`shrink-0 whitespace-nowrap rounded-full text-xs ${config.className}`}
                  >
                    {config.label}
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border bg-secondary/20 p-4 @sm:p-5">
                  <div className="grid gap-5 @3xl:grid-cols-[1fr_240px]">
                    <div className="space-y-4">
                      {job && (
                        <div className="flex flex-wrap gap-2">
                          {job.employmentType && (
                            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                              <Clock className="size-3" />
                              {job.employmentType.replace("_", " ")}
                            </span>
                          )}
                          {job.workplaceType && (
                            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                              <MapPin className="size-3" />
                              {job.workplaceType.replace("_", " ")}
                            </span>
                          )}
                          {(job.salaryMin != null || job.salaryMax != null) && (
                            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground/80">
                              {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                            </span>
                          )}
                        </div>
                      )}

                      {job && job.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {job.tags.map(tag => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="rounded-full border-jade/20 bg-jade/5 px-2.5 py-0.5 text-[11px] text-jade"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {application.coverLetter && (
                        <div>
                          <h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-foreground/80">
                            <FileText className="size-3" />
                            Your cover letter
                          </h3>
                          <p className="rounded-lg border border-border/60 bg-card p-3 text-sm leading-relaxed text-foreground/70">
                            {application.coverLetter}
                          </p>
                        </div>
                      )}

                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">Timeline</h4>
                        <div className="space-y-1.5 text-sm">
                          <p className="text-foreground/80">
                            Applied {new Date(application.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          {application.updatedAt !== application.createdAt && (
                            <p className="text-muted-foreground">
                              Updated {new Date(application.decidedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          )}
                        </div>
                      </div>

                      {job && (
                        <Button asChild size="sm" variant="outline" className="w-full rounded-lg text-xs">
                          <Link href={`/jobs/${application.jobId}`}>
                            <ExternalLink className="mr-2 size-3" />
                            View job posting
                          </Link>
                        </Button>
                      )}

                      {canWithdraw && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full rounded-lg text-xs text-destructive hover:bg-destructive/10"
                          disabled={withdrawingId === application._id}
                          onClick={async e => {
                            e.stopPropagation()
                            setStatusText(null)
                            setWithdrawingId(application._id)
                            try {
                              await withdrawApplication({ applicationId: application._id })
                              setStatusText("Application withdrawn.")
                            } catch (error) {
                              setStatusText(getErrorMessage(error, "Could not withdraw application."))
                            } finally{
                              setWithdrawingId(null)
                            }
                          }}
                        >
                          <XCircle className="mr-2 size-3" />
                          {withdrawingId === application._id ? "Withdrawing..." : "Withdraw application" }
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </section>
  )
}