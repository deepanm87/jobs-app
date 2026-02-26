"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { getErrorMessage } from "@/lib/convex-error"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Award,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  MapPin,
  Phone,
  Sparkles,
  User,
  XCircle
} from "lucide-react"
import { RichTextDisplay } from "@/components/rich-text-display"
import Image from "next/image"

type CompanyStatus = 
  | "submitted"
  | "in_review"
  | "accepted"
  | "rejected"
  | "withdrawn"

type DecisionStatus = "in_review" | "accepted" | "rejected"

const statusConfig: Record<string, { 
  label: string
  className: string
}> = {
  submitted: {
    label: "Submitted",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
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

export default function CompanyApplicationsPage() {
  const {orgId, has } = useAuth()
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | "all">("all")
  const [statusText, setStatusText] = useState<string | null>(null)
  const [mutatingApplicationId, setMutatingApplicationId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [skillsFilter, setSkillsFilter] = useState("")
  const [minYearsExperience, setMinYearsExperience] = useState<string>("")
  const [maxYearsExperience, setMaxYearsExperience] = useState<string>("")

  const debouncedSkillsFilter = useDebouncedValue(skillsFilter, 1000)
  const debouncedMinYears = useDebouncedValue(minYearsExperience, 1000)
  const debouncedMaxYears = useDebouncedValue(maxYearsExperience, 1000)

  const hasAdvancedFilters = has?.({ feature: "advanced_filters" }) ?? false

  const companyContext = useQuery(
    api.companies.getMyCompanyContext,
    orgId ? { clerkOrgId: orgId } : "skip"
  )
  const applications = useQuery(
    api.applications.listCompanyApplications,
    companyContext
      ? {
        companyId: companyContext.companyId,
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 200,
        skills:
          hasAdvancedFilters && debouncedSkillsFilter.trim()
            ? debouncedSkillsFilter
              .split(",")
              .map(s => s.trim())
              .filter(Boolean)
            : undefined,
        minYearsExperience:
          hasAdvancedFilters &&
          debouncedMinYears !== "" &&
          !Number.isNaN(Number(debouncedMinYears))
            ? Number(debouncedMinYears)
            : undefined,
        maxYearsExperience:
          hasAdvancedFilters &&
          debouncedMaxYears !== "" &&
          !Number.isNaN(Number(debouncedMaxYears))
            ? Number(debouncedMaxYears)
            : undefined
      }
    : "skip"
  )
  const updateApplicationStatus = useMutation(
    api.applications.updateApplicationStatus
  )

  const canDecide = 
    companyContext?.role === "admin" || companyContext?.role === "recruiter"

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

  if (!orgId) {
    return (
      <Card className="warm-shadow">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Select an organization to continue.
        </CardContent>
      </Card>
    )
  }

  if (companyContext === undefined || applications === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-muted/60"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
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

  const statusCounts: Record<string, number> = {}
  for (const appn of applications) {
    statusCounts[appn.status] = (statusCounts[appn.status] ?? 0) + 1
  }

  return (
    <section className="animate-fade-in space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="font-(family-name:--font-bricolage)) text-2xl font-bold tracking-tight text-foreground">
            Applications
          </h1>
          <p className="mt-1 text-muted-foreground">
            Review candidate profiles and make hiring decisions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center">
            <Filter className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
            <select
              className="h-10 w-full min-w-[180px] appearance-none rounded-xl border border-border bg-card py-2 pl-9 pr-8 text-sm font-medium text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/20 md:w-auto"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as CompanyStatus | "all")}
            >
              <option value="all">All statuses ({applications.length})</option>
              <option value="submitted">Submitted ({statusCounts["submitted"] ?? 0})</option>
              <option value="in_review">In review ({statusCounts["in_review"] ?? 0})</option>
              <option value="accepted">Accepted ({statusCounts["accepted"] ?? 0})</option>
              <option value="rejected">Rejected ({statusCounts["rejected"] ?? 0})</option>
              <option value="withdrawn">Withdrawn ({statusCounts["withdrawn"] ?? 0})</option>
            </select>
            <ChevronDown className="absolute right-2.5 size-4 text-muted-foreground pointer-events-none" />
          </div>

          {hasAdvancedFilters && (
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/80 bg-muted/30 p-3">
              <div className="space-y-1">
                <Label htmlFor="skills-filter" className="text-xs font-medium text-muted-foreground">
                  Skills (comma-separated)
                </Label>
                <Input 
                  id="skills-filter"
                  type="text"
                  placeholder="e.g. React, TypeScript"
                  value={skillsFilter}
                  onChange={e => setSkillsFilter(e.target.value)}
                  className="h-9 w-48 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="min-years" className="text-xs font-medium text-muted-foreground">
                  Min years
                </Label>
                <Input 
                  id="min-years"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={minYearsExperience}
                  onChange={e => setMinYearsExperience(e.target.value)}
                  className="h-9 w-20 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="max-years" className="text-xs font-medium text-muted-foreground">
                  Max years
                </Label>
                <Input 
                  id="max-years"
                  type="number"
                  min={0}
                  placeholder="Any"
                  value={maxYearsExperience}
                  onChange={e => setMaxYearsExperience(e.target.value)}
                  className="h-9 w-20 text-sm"
                />
              </div>
              {(skillsFilter.trim() || minYearsExperience !== "" || maxYearsExperience !== "") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground"
                  onClick={() => {
                    setSkillsFilter("")
                    setMinYearsExperience("")
                    setMaxYearsExperience("")
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {statusText && (
        <p className="text-sm text-muted-foreground">{statusText}</p>
      )}

      {applications.length === 0 && (
        <Card className="rounded-2xl border border-border/80 bg-card">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <FileText className="size-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-(family-name:--font-bricolage) font-semibold text-foreground">
                No applications found
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {statusFilter === "all" && 
                  !skillsFilter.trim() &&
                  minYearsExperience === "" &&
                  maxYearsExperience === ""
                    ? "Applications will appear here once candidates apply to your jobs."
                    : "No applications match your filters. Try adjusting them."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {applications.map((application, index) => {
          const config = statusConfig[application.status] ?? statusConfig.submitted
          const isExpanded = expandedIds.has(application._id)
          const applicantName = formatApplicant(application.applicant)
          const hasProfile = 
            application.profile ||
            (application.experiences?.length ?? 0) > 0 ||
            (application.education?.length ?? 0) > 0

          return (
            <Card
              key={application._id}
              className="@container animate-slide-up rounded-2xl border border-border/80 bg-card transition-all hover:border-border hover:shadow-md"
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <button
                type="button"
                className="w-full cursor-pointer rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={() => toggleExpanded(application._id)}
              >
                <div className="flex items-start gap-4 p-4 @sm:p-5">
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-muted-foreground ring-2 ring-background">
                    {application.applicant?.imageUrl ? (
                      <Image 
                        src={application.applicant.imageUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      applicantName[0]?.toUpperCase() ?? "?"
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-(family-name:--font-bricolage) font-semibold text-foreground">
                        {applicantName}
                      </span>
                      {application.profile?.openToWork && (
                        <Badge
                          variant="outline"
                          className="gap-1 rounded-full border-jade/30 bg-jade/10 px-2 py-0 text-[10px] font-medium text-jade"
                        >
                          <Sparkles className="size-2.5" />
                          Open
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {application.profile?.headline ??
                        application.applicant?.email ??
                      "-"}
                    </p>
                    <p className="line-clamp-1 text-xs text-muted-foreground/90">
                      Applied for{" "}
                      <span className="font-medium text-foreground/80">
                        {application.job?.title ?? "Unknown job"}
                      </span>
                      {" · "}
                      {new Date(application.createdAt).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </p>
                    <div className="hidden flex-wrap items-center gap-2 pt-1 @md:flex">
                      {(application.experiences?.length ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 px-2 py-0.5 text-[11px] text-muted-foreground">
                          <Briefcase className="size-2.5" />
                          {application.experiences?.length} exp
                        </span>
                      )}
                      {(application.education?.length ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 px-2 py-0.5 text-[11px] text-muted-foreground">
                          <GraduationCap className="size-2.5" />
                          {application.education?.length} edu
                        </span>
                      )}
                      {(application.profile?.skills?.length ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 px-2 py-0.5 text-[11px] text-muted-foreground">
                          {application.profile!.skills.length} skills
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge
                      variant="outline"
                      className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
                    >
                      {config.label}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border/80 bg-muted/30 px-4 py-5 @sm:px-5">
                  <div className="grid gap-6 @3xl:grid-cols-[1fr_280px]">
                    <div className="space-y-5">
                      {(application.profile?.summary ||
                        application.coverLetter) && (
                          <div>
                            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground/80">
                              <User className="size-3.5" />
                              {application.profile?.summary
                                ? "Summary"
                                : "Cover Letter"
                              }
                            </h3>
                            <p className="text-sm leading-relaxed text-foreground/70">
                              {application.profile?.summary ??
                                application.coverLetter
                              }
                            </p>
                            {application.profile?.summary && 
                              application.coverLetter && (
                                <div className="mt-3">
                                  <h4 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                                    Cover Letter
                                  </h4>
                                  <p className="text-sm leading-relaxed text-foreground/70">
                                    {application.coverLetter}
                                  </p>
                                </div>
                              )
                            }
                          </div>
                        )
                      }

                      {(application.experiences?.length ?? 0) > 0 && (
                        <div>
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground/80">
                            <Briefcase className="size-3.5 text-terracotta" />
                            Experience
                          </h3>
                          <div className="space-y-3">
                            {application.experiences?.map(exp => (
                              <div
                                key={exp._id}
                                className="flex gap-3 rounded-lg border border-border/60 bg-card p-3"
                              >
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
                                  <Briefcase className="size-3.5" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">
                                    {exp.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {exp.company}
                                    {exp.location && ` · ${exp.location}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {exp.startDate} —{" "}
                                    {exp.isCurrent
                                      ? "Present"
                                      : (exp.endDate ?? "")
                                    }
                                  </p>
                                  {exp.description && (
                                    <RichTextDisplay 
                                      content={exp.description}
                                      className="mt-1.5 text-xs leading-relaxed text-foreground/70"
                                    />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(application.education?.length ?? 0) > 0 && (
                        <div>
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground/80">
                            <GraduationCap className="size-3.5 text-jade" />
                            Education
                          </h3>
                          <div className="space-y-3">
                            {application.education?.map(edu => (
                              <div
                                key={edu._id}
                                className="flex gap-3 rounded-lg border border-border/60 bg-card p-3"
                              >
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-jade/10 text-jade">
                                  <GraduationCap className="size-3.5" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">
                                    {edu.school}
                                  </p>
                                  {(edu.degree || edu.fieldOfStudy) && (
                                    <p className="text-xs text-muted-foreground">
                                      {[edu.degree, edu.fieldOfStudy]
                                        .filter(Boolean)
                                        .join(", ")
                                      }
                                    </p>
                                  )}
                                  {(edu.startDate || edu.endDate) && (
                                    <p className="text-xs text-muted-foreground">
                                      {[edu.startDate, edu.endDate]
                                        .filter(Boolean)
                                        .join(" - ")
                                      }
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
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground/80">
                            <Award className="size-3.5 text-amber-accent" />
                            Certifications
                          </h3>
                          <div className="space-y-2">
                            {application.certifications?.map(cert => (
                              <div
                                key={cert._id}
                                className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3"
                              >
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-accent/10 text-amber-accent">
                                  <Award className="size-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold">
                                    {cert.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {cert.issuingOrg}
                                    {cert.issueDate &&
                                      ` · ${cert.issueDate}`
                                    }
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
                                    <ExternalLink className="size-3.5" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!hasProfile && !application.coverLetter && (
                        <p className="py-4 text-center text-sm italic text-muted-foreground">
                          This applicant hasn&apos;t completed their profile yet.
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      {(application.profile?.skills?.length ?? 0) > 0 && (
                        <div>
                          <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                            Skills
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {application.profile!.skills.map(skill => (
                              <Badge
                                key={skill}
                                variant="outline"
                                className="rounded-full border-jade/20 bg-jade/5 px-2.5 py-0.5 text-[11px] text-jade"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                          Contact & Links
                        </h4>
                        <div className="space-y-1.5 text-sm">
                          {application.applicant?.email && (
                            <p className="text-foreground/80">
                              {application.applicant.email}
                            </p>
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
                            <a
                              href={application.profile.linkedinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-jade hover:underline"
                              onClick={e => e.stopPropagation()}
                            >
                              <Linkedin className="size-3" />
                              LinkedIn
                            </a>
                          )}
                          {application.profile?.githubUrl && (
                            <a
                              href={application.profile.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-jade hover:underline"
                              onClick={e => e.stopPropagation()}
                            >
                              <Github className="size-3" />
                              Github
                            </a>
                          )}
                          {application.profile?.website && (
                            <a
                              href={application.profile.website}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-jade hover:underline"
                              onClick={e => e.stopPropagation()}
                            >
                              <Globe className="size-3" />
                              Website
                            </a>
                          )}
                        </div>
                      </div>

                      {(application.resumes?.length ?? 0) > 0 && (
                        <div>
                          <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                            Resume &amp; Resources
                          </h4>
                          <div className="space-y-2">
                            {application.resumes?.map(file => (
                              <a
                                key={file._id}
                                href={file.fileUrl ?? "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-secondary/30"
                                onClick={e => e.stopPropagation()}
                              >
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-jade/10 text-jade">
                                  <FileText className="size-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">
                                    {file.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {file.fileName}
                                    {file.fileSize !== null &&
                                      ` · ${formatBytes(file.fileSize)}`
                                    }
                                  </p>
                                </div>
                                <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {application.profile?.yearsOfExperience !== null && (
                        <div className="rounded-lg border border-border bg-card p-3">
                          <p className="text-xs text-muted-foreground">
                            Years of experience
                          </p>
                          <p className="text-lg font-bold">
                            {application.profile.yearsExperience}
                          </p>
                        </div>
                      )}

                      {canDecide && application.status !== "withdrawn" && (
                        <div className="space-y-2 border-t border-border pt-4">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                            Actions
                          </h4>
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full justify-start rounded-lg text-xs"
                              disabled={
                                mutatingApplicationId === application._id ||
                                application.status === "in_review"
                              }
                              onClick={e => {
                                e.stopPropagation()
                                handleStatusUpdate(application._id, "in_review")
                              }}
                            >
                              <Clock className="mr-2 size-3.5" />
                              Move to review
                            </Button>
                            <Button
                              size="sm"
                              className="w-full justify-start rounded-lg bg-jade text-white text-xs hover:bg-jade/90"
                              disabled={
                                mutatingApplicationId === application._id ||
                                application.status === "accepted"
                              }
                              onClick={e => {
                                e.stopPropagation()
                                handleStatusUpdate(application._id, "accepted")
                              }}
                            >
                              <CheckCircle2 className="mr-2 size-3.5" />
                              Accept candidate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full justify-start rounded-lg text-xs text-destructive hover:bg-destructive/10"
                              disabled={
                                mutatingApplicationId === application._id ||
                                application.status === "rejected"
                              }
                              onClick={e => {
                                e.stopPropagation()
                                handleStatusUpdate(application._id, "rejected")
                              }}
                            >
                              <XCircle className="mr-2 size-3.5" />
                              Reject candidate
                            </Button>
                          </div>
                        </div>
                      )}

                      {!canDecide && (
                        <p className="text-xs text-muted-foreground">
                          Read-only access for your role.
                        </p>
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

  async function handleStatusUpdate(
    applicationId: string,
    nextStatus: DecisionStatus
  ) {
    setStatusText(null)
    setMutatingApplicationId(applicationId)
    try {
      await updateApplicationStatus({
        applicationId:
          applicationId as Parameters<typeof updateApplicationStatus>[0]["applicationId"],
        status: nextStatus
      })
      setStatusText(`Applicant moved to ${nextStatus.replace("_", "")}.`)
    } catch (error) {
      setStatusText(getErrorMessage(error, "Could not update application status."))
    } finally {
      setMutatingApplicationId(null)
    }
  }
}

function formatApplicant(
  applicant: {
    firstName?: string
    lastName?: string
    email?: string
  } | null
) {
  if (!applicant) {
    return "Unknown applicant"
  }
  const fullName = 
    `${applicant.firstName ?? ""} ${applicant.lastName ?? ""}`.trim()
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