import { CreateOrganization, OrganizationSwitcher, PricingTable } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Lock } from "lucide-react"
import { SiteLogo } from "@/components/site-logo"

export default async function PricingPage() {
  const {orgId, has } = await auth()
  const isAdmin = orgId ? has({ role: "org:admin" }) : false

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-7xl items-center px-6 py-3">
          <SiteLogo />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12">
        <div className="animate-fade-in space-y-2 text-center">
          <h1 className="font-family-name:var(--font-bricolage) text-3xl font-bold tracking-tight">
            Company plans
          </h1>
          <p className="text-muted-foreground">
            Pick a plan for your organization. Billing is per-organization, not per-user.
          </p>
        </div>

        {!orgId ? (
          <Card className="animate-slide-up warm-shadow mx-auto w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
                <Building2 className="size-6" />
              </div>
              <CardTitle className="font-family-name:var(--font-bricolage) text-xl tracking-tight">
                Create your organization first
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Set up a company workspace, then choose a plan for your team.
              </p>
            </CardHeader>
            <CardContent>
              <CreateOrganization 
                afterCreateOrganizationUrl="/pricing"
              />
            </CardContent>
          </Card>
        ) : !isAdmin ? (
          <Card className="animnate-slide-up warm-shadow mx-auto w-full max-w-lg">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
                <Lock className="size-5 text-muted-foreground" />
              </div>
              <p className="font-medium">Only admins can manage plans</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Add your organization admin to update the billing plan. You can switch organization below if you&apos;re an admin elsewhere.
              </p>
              <div className="mt-2">
                <OrganizationSwitcher hidePersonal />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="animate-slide-up warm-shadow overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-family-name:var(--font-bricolage) text-lg tracking-tight">
                  Choose a plan
                </CardTitle>
                <OrganizationSwitcher hidePersonal />
              </div>
              <p className="text-sm text-muted-foreground">
                Switch organizations above if you manage multiple workspaces.
              </p>
            </CardHeader>
            <CardContent>
              <PricingTable for="organization" />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}