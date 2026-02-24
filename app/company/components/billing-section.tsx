"use client"

import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { Protect } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  BriefcaseBusiness,
  CreditCard,
  Filter,
  Lock,
  Shield,
  Sparkles,
  Users
} from "lucide-react"

function FeatureCard({
  icon: Icon,
  title,
  description,
  enabled,
  planHint
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  enabled: boolean
  planHint?: string
}) {
  const content = (
    <div className="flex items-start gap-3">
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${enabled ? "bg-jade/10 text-jade" : "bg-secondary text-muted-foreground"}`}>
        <Icon className="size=3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <p className={`text-xs font-medium ${enabled ? "text-jade" : "text-amber-accent"}`}>
            {enabled ? "Enabled" : "Locked"}
          </p>
          {!enabled && planHint && (
            <Badge
              variant="secondary"
              className="px-1.5 py-0 text-[10px] leading-4"
            >
              {planHint}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )

  if (!enabled) {
    return (
      <Link
        href="/company/billing"
        className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-terracotta/40 hover:bg-terracotta/5"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {content}
    </div>
  )
}

export function BillingSection() {
  const { has } = useAuth()

  const canInviteTeam = has?.({ feature: "team_management" }) ?? false
  const canPostMoreJobs = has?.({ feature: "job_posting" }) ?? false
  const canManageInvites = 
    has?.({ permission: "org:team_management:invite" }) ?? false
  const canManageJobs = (has?.({ role: "org:admin" }) || has?.({ role: "org:recruiter" })) ?? false

  const hasStarterPlan = has?.({ plan: "starter" }) ?? false
  const hasGrowthPlan = has?.({ plan: "growth" }) ?? false
  const hasAdvancedFilters = has?.({ feature: "advanced_filters" }) ?? false
  const currentPlan = hasGrowthPlan
    ? "growth"
    : hasStarterPlan
      ? "starter"
      : "free"

  const seatLimit = currentPlan === "growth" ? 10 : currentPlan === "starter" ? 3 : 1
  const jobLimit = currentPlan === "growth" ? 25 : currentPlan === "starter" ? 5 : 1

  return (
    <Protect
      role="org:admin"
      fallback={
        <Card className="warm-shadow">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
            <Lock className="size-4" />
            Only organization admins can manage billing.
          </CardContent>
        </Card>
      }
    >
      <Card className="warm-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-(family-name:var(--font-bricolage) text-lg tracking-tight">
              <CreditCard className="size-4 text-amber-accent" />
              Billing
            </CardTitle>
            <Badge variant="outline" className="capitalize">
              {currentPlan} plan
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {seatLimit} seat{seatLimit > 1 ? "s" : ""} · {jobLimit} active job
            {jobLimit > 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="@container">
            <div className="grid gap-3 @sm:grid-cols-2 @2xl:grid-cols-3">
              <FeatureCard 
                icon={Users}
                title="Team invites"
                description="Invite members to your organization"
                enabled={canInviteTeam && canManageInvites}
              />
              <FeatureCard 
                icon={BriefcaseBusiness}
                title="Job posting"
                description="Create and publish job listings"
                enabled={canPostMoreJobs}
              />
              <FeatureCard 
                icon={Shield}
                title="Job management"
                description="Edit, close, and reopen listings"
                enabled={canManageJobs}
              />
              <FeatureCard 
                icon={Filter}
                title="Advanced filters"
                description="Filter candidates by skills, experience & more"
                enabled={hasAdvancedFilters}
                planHint={!hasAdvancedFilters ? "Growth" : undefined}
              />
              <FeatureCard 
                icon={Users}
                title="10 team seats"
                description="Expand your hiring team"
                enabled={hasGrowthPlan}
                planHint={!hasGrowthPlan ? "Growth" : undefined}
              />
              <FeatureCard 
                icon={BriefcaseBusiness}
                title="25 active jobs"
                description="Scale your job board presence"
                enabled={hasGrowthPlan}
                planHint={!hasGrowthPlan ? "Growth" : undefined}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Link href="/company/billing">
                Manage Billing
                <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
            {currentPlan !== "growth" && (
              <Button
                asChild
                size="sm"
                className="rounded-full bg-terracotta text-white hover:bg-terracotta/90"
              >
                <Link href="/company/billing">
                  <Sparkles className="mr-1 size-3.5" />
                  Upgrade plan
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Protect>
  )
}