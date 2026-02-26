"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { getErrorMessage } from "@/lib/convex-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Award,
  Briefcase,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  User,
  Users,
  X,
  XCircle
} from "lucide-react"

type DecisionStatus = "in_review" | "accepted" | "rejected"

const statusConfig: Record<string, { 
  label: string
  className: string
}> = {
  submitted: {
    label: "Submitted",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-300 dark:border-blue-800"
  },
  in_review: {
    label: "In review",
    className: "bg-amber-accent/10 text-amber-accent border-amber-accent/20"
  },
  accepted: {
    label: "Accepted",
    className: "bg-jade/10 text-jade border-jade/20"
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/20"
  },
  withdrawn: {
    label: "Withdrawn",
    className: "border-border text-muted-foreground"
  }
}

type Tab = "active" | "closed"

export default function CompanyJobsPage() {
  const { orgId } = useAuth()
  const [tab, setTab] = useState<Tab>("active")
  const [statusText, setStatusText] = useState<string | null>(null)
  const [mutatingJobId, setMutatingJobId] = useState<string | null>(null)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  const companyContext = useQuery(
    api.companies.getMyCompanyContext,
    orgId ? { clerkOrgId: orgId} : "skip"
  )
  const allJobs = useQuery(
    api.jobs.listCompanyJobs,
    companyContext
      ? { companyId: companyContext.companyId, includeClosed: true, limit: 200 }
      : "skip"
  )
  const closeJobListing = useMutation(api.jobs.closeJobListing)
  const updateJobListing = useMutation(api.jobs.updateJobListing)

  const canManage = companyContext?.role === "admin" || companyContext?.role === "recruiter"

  const activeJobs = allJobs?.filter(j => j.isActive) ?? []
  const closedJobs = allJobs?.filter(j => !j.isActive) ?? []
  const jobs = tab === "active" ? activeJobs : closedJobs

  if (!orgId) {
    return (
      <Card className="warm-shadow">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Select an organization to continue.
        </CardContent>
      </Card>
    )
  }

  if (companyContext === undefined || allJobs === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary" />
        ))}
      </div>
    )
  }

  if (!companyContext) {
    return (
      <Card className="warm-shadow">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Your organization data is still syncing. Refresh in a few seconds.
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-(family-name:--font-bricolage) text-2xl font-bold tracking-tight">
            Job listings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your company&apos;s open and closed positions.
          </p>
        </div>
        {canManage && (
          <Button asChild size="sm" className="rounded-full bg-terracotta text-white hover:bg-terracotta/90">
            <Link href="/company/jobs/new">
              <Plus className="mr-1 size-3.5" />
              New listing
            </Link>
          </Button>
        )}
      </div>

      <div className="flex border-b border-border">
        <button
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "active"
               ? "border-b-2 border-foreground text-foreground"
               : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Active
          <span className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none ${
            tab === "active" ? "bg-jade/10 text-jade" : "bg-secondary text-muted-foreground"
          }`}>
            {activeJobs.length}
          </span>
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "closed"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground hover:text-foreground"
            }`}
          onClick={() => { 
            setTab("closed")
            setExpandedJobId(null)
          }}
        >
          Closed
          <span className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none ${
            tab === "closed" ? "bg-secondary text-foreground" : "bg-secondary text-muted-foreground"
          }`}>
            {closedJobs.length}
          </span>
        </button>
      </div>

      {statusText && <p className="text-xs text-muted-foreground">{statusText}</p>}

      {jobs.length === 0 && (
        <Card className="warm-shadow">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-terracotta/10">
              <BriefcaseBusiness className="size-5 text-terracotta" />
            </div>
            <p className="font-medium">
              {tab === "active" ? "No active listings" : "No closed listings" }
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {tab === "active"
                ? "Post a new job to start receiving applications from candidates."
                : "Closed positions wil appear here."
              }
            </p>
            {tab === "active" && canManage && (
              <Button asChild className="mt-2 rounded-full bg-terracotta text-white hover:bg-terracotta/90">
                <Link href="/company/jobs/new">
                  <Plus className="mr-1.5 size-3.5" />
                  Post your first job
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {jobs.map((job, index) => {
          const isExpanded = expandedJobId === job._id

          return (
            <Card
              key={job._id}
              className="@container animate-slide-up warm-shadow overflow-hidden transition-all hover:warm-shadow-md"
              style={{ animationDelay: `${index * 0.04}s `}}
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="font-(family-name:--font-bricolage) text-lg tracking-tight">
                      {job.title}
                    </CardTitle>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3" />
                      {job.location}
                      <span className="text-border">·</span>
                      {job.workplaceType.replace("_", " ")}
                      <span className="text-border">·</span>
                      {job.employmentType.replace("_", " ")}
                    </p>
                  </div>
                  {job.autoCloseOnAccept && (
                    <Badge variant="outline" className="rounded-full text-xs">
                      Auto-close
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <button
                    className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium transition-colors hover:bg-secondary/80"
                    onClick={() => setExpandedJobId(isExpanded ? null : job._id )}
                  >
                    <Users className="size-3" />
                    {job.applicationCount} appilcant{job.applicationCount !== 1 ? "s" : ""}
                    {isExpanded ? (
                      <ChevronUp className="size-3" />
                    ) : (
                      <ChevronDown className="size-3" />
                    )}
                  </button>
                  <span className="text-border">·</span>
                  <span>Updated {new Date(job.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <span className="text-border">·</span>
                  <span className="font-medium text-foreground">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
                </div>

                {canManage ? (
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    {job.isActive ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-xs"
                        disabled={mutatingJobId === job._id}
                        onClick={async () => {
                          setStatusText(null)
                          setMutatingJobId(job._id)
                          try {
                            await closeJobListing({
                              companyId: companyContext.companyId,
                              jobId: job._id
                            })
                            setStatusText("Job listing closed.")
                          } catch (error) {
                            setStatusText(getErrorMessage(error, "Could not close job listing."))
                          } finally {
                            setMutatingJobId(null)
                          }
                        }}
                      >
                        <X className="mr-1 size-3" />
                        Close listing
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-xs"
                        disabled={mutatingJobId === job._id}
                        onClick={async () => {
                          setStatusText(null)
                          setMutatingJobId(job._id)
                          try {
                            await updateJobListing({
                              companyId: companyContext.companyId,
                              jobId: job._id,
                              isActive: true
                            })
                            setStatusText("Job listing reopened.")
                          } catch (error) {
                            setStatusText(getErrorMessage(error, "Could not reopen job listing."))
                          } finally {
                            setMutatingJobId(null)
                          }
                        }}
                      >
                        <RotateCcw className="mr-1 size-3" />
                        Reopen
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline" className="rounded-full text-xs">
                      <Link href={`/company/jobs/${job._id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-xs text-muted-foreground"
                      disabled={mutatingJobId === job._id}
                      onClick={async () => {
                        setStatusText(null)
                        setMutatingJobId(job._id)
                        try {
                          await updateJobListing({
                            companyId: companyContext.companyId,
                            jobId: job._id,
                            autoCloseOnAccept: !job.autoCloseOnAccept
                          })
                          setStatusText(
                            !job.autoCloseOnAccept
                              ? "Auto-close on accept enabled."
                              : "Auto-close on accept disabled."
                          )
                        } catch (error) {
                          setStatusText(getErrorMessage(error, "Could not update auto-close setting."))
                        } finally {
                          setMutatingJobId(null)
                        }
                      }}
                    >
                      {job.autoCloseOnAccept ? <ToggleRight className="mr-1 size-3" /> : <ToggleLeft className="mr-1 size-3" />}
                      {job.autoCloseOnAccept ? "Disable auto-close" : "Enable auto-close" }
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Read-only access for your role.
                  </p>
                )}
              </CardContent>

              {isExpanded && (
                <JobApplicants 
                  companyId={companyContext.companyId}
                  jobId={job._id as Id<"jobListings">}
                  canDecide={canManage}
                />
              )}
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function JobApplicants({
  companyId,
  jobId,
  canDecide
}: {
  companyId: Id<"companies">
  jobId: Id<"jobListings">
  canDecide: boolean
}) {
  const applications = useQuery(api.applications.listCompanyApplications, {
    companyId,
    jobId,
    limit: 100
  })
  const updateApplicationStatus = useMutation(api.applications.updateApplicationStatus)

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [mutatingAppId, setMutatingAppId] = useState<string | null>(null)

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleStatusUpdate(applicationId: string, nextStatus: DecisionStatus) {
    setMutatingAppId(applicationId)
    try {
      await updateApplicationStatus({
        applicationId: applicationId as Id<"applications">,
        status: nextStatus
      })
    } finally {
      setMutatingAppId(null)
    }
  }

  if (applications === undefined) {
    return (
      <div className="border-t border-border bg-secondary/20 p-5">
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="border-t border-border bg-secondary/20 px-5 py-8 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-secondary">
          <Users className="size-4 text-muted-foreground" />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">No applications yet</p>
      </div>
    )
  }

  return (
    <div className="border-t border-border bg-secondary/20 p-4">
      <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
        {applications.length} applicant{applications.length !== 1 ? "s" : ""}
      </p>
      <div className="space-y-2">
        {[...applications]
          .sort((a, b) => {
            if (a.status === "withdrawn" && b.status !== "withdrawn") {
              return 1
            }
            if (a.status !== "withdrawn" && b.status === "withdrawn") {
              return -1
            }
            return 0
          })
          .map(application => {
            const config = statusConfig[application.status] ?? statusConfig.submitted
            const isExpanded = expandedIds.has(application._id)
            const applicantName = formatApplicant(application.applicant)
            const isWithdrawn = application.status === "withdrawn"
            const hasProfile = 
              application.profile ||
              (application.experiences?.length ?? 0) > 0 ||
              (application.education?.length ?? 0) > 0

            return (
              <div
                key={application._id}
                className={`overflow-hidden rounded-xl border border-border bg-card transition-all ${isWithdrawn ? "opacity-50" : ""}`}
              >
                <div
                  className="flex cursor-pointer items-center gap-3 p-3"
                  onClick={() => toggleExpanded(application._id)}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                    {application.applicant?.imageUrl ? (
                      <Image 
                        src={application.applicant.imageUrl}
                        alt=""
                        className="size-full rounded-full object-cover"
                      />
                    ) : (
                      applicantName[0]?.toUpperCase() ?? "?"
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{applicantName}</p>
                      {application.profile?.openToWork && (
                        <Badge className="gap-0.5 rounded-full bg-jade/10 px-1.5 py-0 text-[10px] font-medium text-jade border-jade/20" variant="outline">
                          <Sparkles className="size-2.5" />
                          Open
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {application.profile?.headline ?? application.applicant?.email ?? "-"}
                      <span className="mx-1.5 text-border">·</span>
                      {new Date(application.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden items-center gap-1.5 @md:flex">
                      {(application.experiences?.length ?? 0) > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                          <Briefcase className="size-2.5" />
                          {application.experiences?.length}
                        </span>
                      )}
                      {(application.education?.length ?? 0) > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                          <GraduationCap className="size-2.5" />
                          {application.education?.length}
                        </span>
                      )}
                      {(application.profile?.skills?.length ?? 0) > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                          {application.profile!.skills.length} skills
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className={`rounded-full text-[11px] ${config.className}`}>
                      {config.label}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="size-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-secondary/30 p-4">
                    <div className="grid gap-5 @3xl:grid-cols-[1fr_260px]">
                      <div className="space-y-4">
                        {(application.profile?.summary || application.coverLetter) && (
                          <div>
                            <h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-foreground/80">
                              <User className="size-3" />
                              {application.profile?.summary ? "Summary" : "Cover Letter"}
                            </h3>
                            <p className="text-sm leading-relaxed text-foreground/70">
                              {application.profile?.summary ?? application.coverLetter}
                            </p>
                            {application.profile?.summary && application.coverLetter && (
                              <div className="mt-2.5">
                                <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                                  Cover Letter
                                </h4>
                                <p className="text-sm leading-relaxed text-foreground/70">
                                  {application.coverLetter}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {(application.experiences?.length ?? 0) > 0 && (
                          <div>
                            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground/80">
                              <Briefcase className="size-3 text-terracotta" />
                              Experience
                            </h3>
                            <div className="space-y-2">
                              {application.experiences?.map(exp => (
                                <div key={exp._id} className="flex gap-3 rounded-lg border border-border/60 bg-card p-2.5">
                                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
                                    <Briefcase className="size-3" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold">{exp.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {exp.company}
                                      {exp.location && ` · ${exp.location}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {exp.startDate} - {exp.isCurrent ? "Present" : (exp.endDate ?? "")}
                                    </p>
                                    {exp.description && (
                                      <p className="mt-1 text-xs leading-relaxed text-foreground/70">{exp.description}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(application.education?.length ?? 0) > 0 && (
                          <div>
                            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground/80">
                              <GraduationCap className="size-3 text-jade" />
                              Education
                            </h3>
                            <div className="space-y-2">
                              {application.education?.map(edu => (
                                <div key={edu._id} className="flex gap-3 rounded-lg border border-border/60 bg-card p-2.5">
                                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-jade/10 text-jade">
                                    <GraduationCap className="size-3" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold">{edu.school}</p>
                                    {(edu.degree || edu.fieldOfStudy) && (
                                      <p className="text-xs text-muted-foreground">
                                        {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(", ")}
                                      </p>
                                    )}
                                    {(edu.startDate || edu.endDate) && (
                                      <p className="text-xs text-muted-foreground">
                                        {[edu.startDate, edu.endDate].filter(Boolean).join(" - ")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(application.certifications?.length ?? 0) > 0 && (
                          <div>
                            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground/80">
                              <Award className="size-3 text-amber-accent" />
                              Certifications
                            </h3>
                            <div className="space-y-1.5">
                              {application.certifications?.map(cert => (
                                <div key={cert._id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-2.5">
                                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-accent/10 text-amber-accent">
                                    <Award className="size-3" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">{cert.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {cert.issuingOrg}
                                      {cert.issueDate && ` · ${cert.issueDate}`}
                                    </p>
                                  </div>
                                  {cert.credentialUrl && (
                                    <a
                                      href={cert.credentialUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-jade hover:underline"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <ExternalLink className="size-3" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!hasProfile && !application.coverLetter && (
                          <p className="py-3 text-center text-sm italic text-muted-foreground">
                            This applicant hasn&apos;t completed their profile yet.
                          </p>
                        )}
                      </div>

                      <div className="space-y-4">
                        {(application.profile?.skills?.length ?? 0) > 0 && (
                          <div>
                            <h4 className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">Skills</h4>
                            <div className="flex flex-wrap gap-1">
                              {application.profile!.skills.map(skill => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="rounded-full border-jade/20 bg-jade/5 px-2 py-0.5 text-[10px] text-jade"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">Contact & Links</h4>
                          <div className="space-y-1 text-sm">
                            {application.applicant?.email && (
                              <p className="text-foreground/80">{application.applicant.email}</p>
                            )}
                            {application.profile?.phone && (
                              <p className="flex items-center gap-1.5 text-foreground/80">
                                <Phone className="size-3" />
                                {application.profile.phone}
                              </p>
                            )}
                            {application.profile?.location && (
                              <p className="flex items-center gap-1.5 text-foreground/80">
                                <MapPin className="size-3" />
                                {application.profile.location}
                              </p>
                            )}
                            {application.profile?.linkedinUrl && (
                              <a href={application.profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-jade hover:underline" onClick={(e) => e.stopPropagation()}>
                                <Linkedin className="size-3" /> LinkedIn
                              </a>
                            )}
                            {application.profile?.githubUrl && (
                              <a href={application.profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-jade hover:underline" onClick={(e) => e.stopPropagation()}>
                                <Github className="size-3" /> GitHub
                              </a>
                            )}
                            {application.profile?.website && (
                              <a href={application.profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-jade hover:underline" onClick={(e) => e.stopPropagation()}>
                                <Globe className="size-3" /> Website
                              </a>
                            )}
                          </div>
                        </div>

                        {(application.resume?.length ?? 0) > 0 && (
                          <div>
                            <h4 className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">Resume</h4>
                            <div className="space-y-1.5">
                              {application.resumes?.map(file => (
                                <a
                                  key={file._id}
                                  href={file.fileUrl ?? "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5 transition-colors hover:bg-secondary/30"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-jade/10 text-jade">
                                    <FileText className="size-3" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium">{file.title}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {file.fileName}
                                      {file.fileSize != null && ` · ${formatBytes(file.fileSize)}`}
                                    </p>
                                  </div>
                                  <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {application.profile?.yearsOfExperience != null && (
                          <div className="rounded-lg border border-border bg-card p-2.5">
                            <p className="text-xs text-muted-foreground">Years of experience</p>
                            <p className="text-lg font-bold">{application.profile.yearsExperience}</p>
                          </div>
                        )}

                        {canDecide && application.status !== "withdrawn" && (
                          <div className="space-y-1.5 border-t border-border pt-3">
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground">Actions</h4>
                            <div className="flex flex-col gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full justify-start rounded-lg text-xs"
                                disabled={mutatingAppId === application._id || application.status === "in_review"}
                                onClick={e => { 
                                  e.stopPropagation()
                                  handleStatusUpdate(application._id, "in_review")
                                }}
                              >
                                <Clock className="mr-2 size-3" /> Move to review
                              </Button>
                              <Button
                                size="sm"
                                className="w-full justify-start rounded-lg bg-jade text-white text-xs hover:bg-jade/90"
                                disabled={mutatingAppId === application._id || application.status === "accepted"}
                                onClick={e => { 
                                  e.stopPropagation()
                                  handleStatusUpdate(application._id, "accepted")
                                }}
                              >
                                <CheckCircle2 className="mr-2 size-3" /> Accept candidate
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full justify-start rounded-lg text-xs text-destructive hover:bg-destructive/10"
                                disabled={mutatingAppId === application._id || application.status === "rejected"}
                                onClick={e => {
                                  e.stopPropagation()
                                  handleStatusUpdate(application._id, "rejected")
                                }}
                              >
                                <XCircle className="mr-2 size-3" /> Reject candidate
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

function formatSalary(salaryMin?: number, salaryMax?: number, salaryCurrency?: string) {
  if (salaryMin === undefined && salaryMax === undefined) {
    return "Salary not specified"
  }
  const currency = salaryCurrency ?? "USD"
  if (salaryMin !== undefined && salaryMax !== undefined) {
    return `${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()} ${currency}`
  }
  return `${(salaryMin ?? salaryMax ?? 0).toLocaleString()} ${currency}`
}

function formatApplicant(applicant: { 
  firstName?: string
  lastName?: string
  email?: string
} | null) {
  if (!applicant) {
    return "Unknown applicant"
  }
  const fullName = `${applicant.firstName ?? ""} ${applicant.lastName ?? ""}`.trim()
  return fullName || applicant.email || "Unknown applicant"
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}