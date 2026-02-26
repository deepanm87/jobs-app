import { PricingTable, Protect } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BillingUsageCards } from "@/app/company/components/billing-usage-cards"
import { CheckCircle2, CreditCard, Lock, XCircle } from "lucide-react"

export default async function CompanyBillingPage() {
  const { has, orgId } = await auth()

  if (!orgId) {
    return (
      <Card className="warm-shadow">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <CreditCard className="size-5 text-muted-foreground" />
          </div>
          <p className="font-medium">Select an organization first</p>
          <p className="text-sm text-muted-foreground">
            Use the organization switcher above, then return to billing.
          </p>
        </CardContent>
      </Card>
    )
  }

  const hasStarterPlan = has({ plan: "starter" })
  const hasGrowthPlan = has({ plan: "growth" })
  const hasAdvancedFilters = has({ feature: "advanced_filters" })
  const hasInvitePermission = has({ permission: "org:team_management:invite" })
  const currentPlan = hasGrowthPlan ? "growth" : hasStarterPlan ? "starter" : "free"
  const seatLimit = currentPlan === "growth" ? 10 : currentPlan === "starter" ? 3 : 1
  const jobLimit = currentPlan === "growth" ? 25 : currentPlan === "starter" ? 5 : 1

  return (
    <section className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-(family-name:var(--font-bricolage)) text-2xl font-bold tracking-tight">
          Billing & plan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organization&apos;s plan, usage limits, and team access.
        </p>
      </div>

      <Card className="warm-shadow border-terracotta/20 bg-terracotta/5">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
              <CreditCard className="size-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Current plan</p>
              <p className="font-(family-name:var(--font-bricolage)) text-2xl font-bold capitalize tracking-tight">
                {currentPlan}
              </p>
              <p className="text-sm text-muted-foreground">
                {seatLimit} seat{seatLimit > 1 ? "s" : ""} · {jobLimit} active job{jobLimit > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="@container">
            <div className="grid gap-2 @sm:grid-cols-2">
              <AccessRow label="Starter Plan" enabled={hasStarterPlan} />
              <AccessRow label="Growth Plan" enabled={hasGrowthPlan} />
              <AccessRow label="Advanced filters" enabled={hasAdvancedFilters} />
              <AccessRow label="Team invite permission" enabled={hasInvitePermission} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle className="font-(family-name:var(--font-bricolage)) text-xl tracking-tight">
            Current usage
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time usage from your workspace, compared against plan limits.
          </p>
        </CardHeader>
        <CardContent>
          <BillingUsageCards seatLimit={seatLimit} jobLimit={jobLimit} />
        </CardContent>
      </Card>

      <Protect
        role="org:admin"
        fallback={
          <Card className="warm-shadow">
            <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
              <Lock className="size-4" />
              Only organization admins can change billing plans.
            </CardContent>
          </Card>
        }
      >
        <Card className="warm-shadow overflow-hidden">
          <CardHeader>
            <CardTitle className="font-(family-name:var(--font-bricolage)) text-xl tracking-tight">
              Change plan
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Upgrade or downgrade your organization&apos;s subscription.
            </p>
          </CardHeader>
          <CardContent>
            <PricingTable for="organization" />
          </CardContent>
        </Card>
      </Protect>
    </section>
  )
}

function AccessRow({ label, enabled }: {
  label: string
  enabled: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-background/60 px-3 py-2.5">
      {enabled ? (
        <CheckCircle2 className="size-4 shrink-0 text-jade" />
      ) : (
        <XCircle className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className="text-sm">{label}</span>
      <span className={`ml-auto text-xs font-medium ${enabled ? "text-jade" : "text-muted-foreground"}`}>
        {enabled ? "Active" : "Locked"}
      </span>
    </div>
  )
}