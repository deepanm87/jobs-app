import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CompanySummaryCards } from "./components/company-summary-cards"
import { BillingSection } from "./components/billing-section"
import { InviteMemberSection } from "./components/invite-member-section"
import { ArrowRight, BriefcaseBusiness, FileText, Sparkles, Users } from "lucide-react"

export default async function CompanyDashboardPage() {
  const {orgId, has } = await auth()
  if (!orgId) {
    return (
      <Card className="warm-shadow">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <Users className="size-5 text-muted-foreground" />
          </div>
          <p className="font-medium">Select an organization</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Use the organization switcher above to pick your company workspace.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-(family-name:var(--font-bricolage)) text-2xl font-bold tracking-tight">
          Company dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          An overview of your workspace, jobs, and team.
        </p>
      </div>

      <CompanySummaryCards orgId={orgId} />

      <div className="@container">
        <div className="grid gap-4 @xl:grid-cols-2">
          <Card className="warm-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-(family-name:var(--font-bricolage)) text-lg tracking-tight">
                <BriefcaseBusiness className="size-4 text-terracotta" />
                Jobs
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Create and manage your active listings.
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/company/jobs">
                  View all jobs
                </Link>
              </Button>
              {(has({ role: "org:admin" }) || has({ role: "org:recruiter" })) && (
                <Button asChild size="sm" className="rounded-full bg-terracotta text-white hover:bg-terracotta/90">
                  <Link href="/company/jobs/new">
                    <Sparkles className="mr-1 size-3.5" />
                    Post new job
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="warm-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-(family-name:var(--font-bricolage)) text-lg tracking-tight">
                <FileText className="size-4 text-jade" />
                Applications
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Review candidates and make hiring decisions.
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/company/applications">
                  Review applications
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <InviteMemberSection />

      <BillingSection />
    </section>
  )
}