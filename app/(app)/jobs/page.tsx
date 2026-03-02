"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { getErrorMessage } from "@/lib/convex-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { stripHtml } from "@/lib/strip-html"
import { ArrowRight, Bookmark, BookmarkCheck, Building2, DollarSign, MapPin, Search, Briefcase } from "lucide-react"

type EmploymentType = "full_time" | "part_time" | "contract" | "internship" | "temporary"
type WorkplaceType = "on_site" | "remote" | "hybrid"

function formatSalary(min?: number, max?: number, currency?: string) {
  if (min === undefined && max === undefined) {
    return "Salary not listed"
  }
  const unit = currency ?? "USD"
  if (min !== undefined && max !== undefined) {
    return `${min.toLocaleString()} - ${max.toLocaleString()} ${unit}`
  }
  return `${(max ?? min ?? 0).toLocaleString()} ${unit}`
}

export default function JobsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchText, setSearchText] = useState(searchParams.get("q") ?? "")
  const [location, setLocation] = useState("")
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType | "">("")
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">(
    (searchParams.get("type") as EmploymentType) ?? ""
  )

  const jobs = useQuery(api.jobs.searchJobListings, {
    searchText: searchText.trim() || undefined,
    location: location.trim() || undefined,
    workplaceType: workplaceType || undefined,
    employmentType: employmentType || undefined,
    limit: 30
  })
  const favorites = useQuery(api.favorites.listMyFavorites, { limit:  200 })
  const addFavorite = useMutation(api.favorites.addFavorite)
  const removeFavorite = useMutation(api.favorites.removeFavorite)
  const [statusText, setStatusText] = useState<string | null>(null)
  const [pendingFavoriteJobId, setPendingFavoriteJobId] = useState<string | null>(null)

  const favoriteJobIds = useMemo(
    () => new Set((favorites ?? []).map(item => item.job?._id).filter(Boolean)),
  [favorites])

  return (
    <section className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-(family-name:--font-bricolage) text-2xl font-bold tracking-tight">
          Find your next role
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search openings by title, location, or type - then save the ones you like.
        </p>
      </div>

      <div className="@container">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 warm-shadow @2xl:flex-row @2xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
              placeholder="Title, company, or skill"
              value={searchText}
              onChange={event => setSearchText(event.target.value)}
            />
          </div>
          <div className="hidden h-8 w-px bg-border @2xl:block" />
          <div className="relative flex-1">
            <MapPin className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
              placeholder="Location"
              value={location}
              onChange={event => setLocation(event.target.value)}
            />
          </div>
          <div className="hidden h-8 w-px bg-border @2xl:block" />
          <select
            className="h-9 rounded-lg border-0 bg-transparent px-3 text-sm text-foreground outline-none"
            value={workplaceType}
            onChange={event => setWorkplaceType(event.target.value as WorkplaceType | "")}
          >
            <option value="">Any workplace</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="on_site">On-site</option>
          </select>
          <div className="hidden h-8 w-px bg-border @2xl:block" />
          <select
            className="h-9 rounded-lg border-0 bg-transparent px-3 text-sm text-foreground outline-none"
            value={employmentType}
            onChange={event => setEmploymentType(event.target.value as EmploymentType | "")}
          >
            <option value="">Any type</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="temporary">Temporary</option>
          </select>
        </div>
      </div>

      {statusText && (
        <p className="text-xs text-muted-foreground">{statusText}</p>
      )}

      <div className="space-y-3">
        {jobs === undefined && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div 
                key={i}
                className="h-36 animate-pulse rounded-xl bg-secondary"
              />
            ))}
          </div>
        )}

        {jobs?.length === 0 && (
          <Card className="warm-shadow">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-jade/10">
                <Search className="size-5 text-jade" />
              </div>
              <p className="font-medium">No jobs match your filters</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Try broadening your search or removing some filters to see more results.
              </p>
            </CardContent>
          </Card>
        )}

        {jobs?.map((job, index) => {
          const isFavorite = favoriteJobIds.has(job._id)
          const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)
          const jobUrl = `/jobs/${job._id}`
          return (
            <div
              key={job._id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(jobUrl)}
              onKeyDown={e => { if (e.key === "Enter") {
                router.push(jobUrl)
              }}}
              className="@container animate-slide-up group cursor-pointer rounded-xl border border-border bg-card warm-shadow transition-all duration-200 hover:-translate-y-0.5 hover:border-jade/30 hover:warm-shadow-md active:translate-y-0 active:shadow-sm"
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <div className="flex gap-4 p-4 @sm:p-5">
                <div className="hidden size-11 shrink-0 items-center justify-center rounded-lg bg-jade/10 text-jade transition-colors group-hover:bg-jade/20 @xs:flex">
                  <Building2 className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-(family-name:--font-bricolage) text-base font-semibold tracking-tight transition-colors group-hover:text-jade @sm:text-lg">
                        {job.title}
                      </span>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        {job.companyName}
                        <span className="text-border">&middot;</span>
                        <MapPin className="size-3" />
                        {job.location}
                      </p>
                    </div>
                    <button
                      className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                        isFavorite
                          ? "bg-jade/10 text-jade hover:bg-jade/20"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      disabled={pendingFavoriteJobId === job._id}
                      onClick={async e => {
                        e.stopPropagation()
                        setStatusText(null)
                        setPendingFavoriteJobId(job._id)
                        try {
                          if (isFavorite) {
                            await removeFavorite({ jobId: job._id})
                            setStatusText("Removed from saved jobs.")
                          } else {
                            await addFavorite({ jobId: job._id })
                            setStatusText("Saved to your favorites")
                          }
                        } catch (error) {
                          setStatusText(getErrorMessage(error, "Could not update saved jobs."))
                        } finally {
                          setPendingFavoriteJobId(null)
                        }
                      }}
                      aria-label={isFavorite ? "Remove from saved" : "Save job"}
                    >
                      {isFavorite ? (
                        <BookmarkCheck className="size-4" />
                      ) : (
                        <Bookmark className="size-4" />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {stripHtml(job.description)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-border/50 px-4 py-3 @sm:flex-row sm:flex-wrap @sm:items-center @sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1 rounded-full text-xs">
                    <Briefcase className="size-3" />
                    {job.employmentType.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="rounded-full text-xs">
                    {job.workplaceType.replace("_", " ")}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 @sm:ml-auto">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-jade/10 px-3 py-1 text-sm font-semibold text-jade">
                    <DollarSign className="size-3.5" />
                    {salary}
                  </span>
                  <Button
                    size="sm"
                    className="rounded-full bg-jade px-5 text-white transition-all hover:bg-jade/90 group-hover:shadow-md"
                  >
                    Details
                    <ArrowRight className="ml-1 size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

