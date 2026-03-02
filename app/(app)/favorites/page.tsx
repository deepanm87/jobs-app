"use client"

import Link from "next/link"
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { getErrorMessage } from "@/lib/convex-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Briefcase, Heart, MapPin, Search, X } from "lucide-react"
import { formatSalary } from "@/lib/format-salary"


export default function FavoritesPage() {
  const favorites = useQuery(api.favorites.listMyFavorites, { limit: 200 })
  const removeFavorite = useMutation(api.favorites.removeFavorite)
  const [statusText, setStatusText] = useState<string | null>(null)
  const [removingJobId, setRemovingJobId] = useState<string | null>(null)

  return (
    <section className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-(family-name:--font-bricolage) text-2xl font-bold tracking-tight">
          Saved jobs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jobs you&apos;ve bookmarked for later - come back anytime.
        </p>
      </div>

      {statusText && (
        <p className="text-xs text-muted-foreground">{statusText}</p>
      )}

      {favorites === undefined && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      )}

      {favorites?.length === 0 && (
        <Card className="warm-shadow">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-jade/10">
              <Heart className="size-5 text-jade" />
            </div>
            <p className="font-medium">Nothing saved yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Browse jobs and tap the bookmark icon to save roles you want to come back to.
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
        {favorites?.map((favorite, index) => {
          const job = favorite.job
          if (!job) {
            return null
          }
          return (
            <Card
              key={favorite._id}
              className="@container animate-slide-up warm-shadow transition-all hover:warm-shadow-md"
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="font-(family-name:--font-tricolage) text-base tracking-tight @sm:text-lg">
                      <Link
                        href={`/jobs/${job._id}`}
                        className="transition-colors hover:text-jade"
                      >
                        {job.title}
                      </Link>
                    </CardTitle>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      {job.companyName}
                      <span className="text-border">·</span>
                      <MapPin className="size-3" />
                      {job.location}
                    </p>
                  </div>
                  <button
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    disabled={removingJobId === job._id}
                    onClick={async () => {
                      setStatusText(null)
                      setRemovingJobId(job._id)
                      try {
                        await removeFavorite({ jobId: job.id })
                        setStatusText("Removed from saved jobs.")
                      } catch (error) {
                        setStatusText(getErrorMessage(error, "Could not remove saved job."))
                      } finally {
                        setRemovingJobId(null)
                      }
                    }}
                    aria-label="Remove from saved"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 @xs:flex-row @xs:flex-wrap @xs:items-center @xs:justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 rounded-full text-xs">
                    <Briefcase className="size-3" />
                    {job.workplaceType.replace("_", " ")}
                  </Badge>
                  <span className="text-sm font-medium">
                    {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                  </span>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="rounded-full bg-jade text-white hover:bg-jade/90"
                >
                  <Link href={`/jobs/${job._id}`}>
                    View job
                    <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}