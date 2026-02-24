"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { OrganizationSwitcher, Protect, UserButton } from "@clerk/nextjs"
import { Bell, BriefcaseBusiness, CreditCard, FileText, LayoutDashboard, Plus } from "lucide-react"
import { NotificationBell } from "@/components/notification-bell"
import { SiteLogo } from "@/components/site-logo"
import { SyncCompanyPlan } from "./components/sync-company-plan"

const exactRoutes = new Set(["/company/jobs/new", "/company/billing"])

const navItems = [
  { href: "/company", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/company/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/company/applications", label: "Applications", icon: FileText }
]

function isNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href
  }
  return (pathname === href || pathname.startsWith(href + "/")) && !exactRoutes.has(pathname)
}

export default function CompanyLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname()

  return (
    <main className="min-h-screen bg-background pb-16 lg:pb-0">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 overflow-hidden px-4 py-2.5 md:gap-4 md:px-6 lg:gap-6">
          <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
            <SiteLogo />
            <span
              className="inline-flex shrink-0 items-center rounded-full border-2 border-terracotta/30 bg-terracotta px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white md:px-3 md:text-xs"
              aria-label="JobsApp Recruiter Panel"
            >
              Recruiter
            </span>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center gap-1 lg:flex lg:gap-1.5 [&::-webkit-scrollbar]:h-0">
            {navItems.map(item => {
              const isActive = isNavActive(pathname, item.href, item.exact)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors lg:px-3.5 ${
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link> 
              )
            })}

            <Protect condition={has => has({ role: "org:admin" }) || has({ role: "org:recruiter" })}>
              <Link
                href="/company/jobs/new"
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors lg:px-3.5 ${
                  pathname === "/company/jobs/new"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
              >
                <Plus className="size-3.5" />
                Post job
              </Link>
            </Protect>

            <Protect role="org:admin">
              <Link
                href="/company/billing"
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors lg:px-3.5 ${
                  pathname === "/company/billing"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
              >
                <CreditCard className="size-3.5" />
                Billing 
              </Link>
            </Protect>
          </nav>

          <div className="ml-auto shrink-0 items-center gap-2 md:gap-3">
            <OrganizationSwitcher hidePersonal />
            <NotificationBell />
            <UserButton />
          </div>
        </div>
      </header>

      <SyncCompanyPlan />
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        {children}
      </div>

      <nav className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {navItems.map(item => {
            const isActive = isNavActive(pathname, item.href, item.exact)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            )
          })}

          <Link
            href="/notifications"
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
              pathname === "/notifications" ? "text-foreground" : "text-muted-foreground"
              }`}
          >
            <Bell className="size-5" />
            Alerts
          </Link>

          <Protect condition={has => has({ role: "org:admin" }) || has({ role: "org:recruiter" })}>
            <Link
              href="/company/jobs/new"
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                pathname === "/company/jobs/new" ? "text-foreground" : "text-muted-foreground"
                }`}
            >
              <Plus className="size-5" />
              Post
            </Link>
          </Protect>

          <Protect role="org:admin">
            <Link
              href="/company/billing"
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                pathname === "/company/billing" ? "text-foreground" : "text-muted-foreground"
                }`}
            >
              <CreditCard className="size-5" />
              Billing
            </Link>
          </Protect>
        </div>
      </nav>
    </main>
  )
}