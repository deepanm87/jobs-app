"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { Bell, Briefcase, Heart, FileText, Pencil, Search } from "lucide-react"
import { NotificationBell } from "@/components/notification-bell"
import { SiteLogo } from "@/components/site-logo"

const navItems = [
  { href: "/jobs", label: "Jobs", icon: Search },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/favorites", label: "Saved", icon: Heart }
]

const mobileNavItems = [
  { href: "/jobs", label: "Jobs", icon: Search },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/favorites", label: "Saved", icon: Heart }
]

export default function CandidateLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()

  return (
    <main className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex w-ful max-w-5xl items-center gap-6 px-6 py-2.5">
          <SiteLogo />

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.slice(0, 2).map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-jade text-white"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary"
                    }`}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <div className="hidden items-center gap-1 md:flex">
              {navItems.slice(2).map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-jade text-white"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                  >
                    <Icon className="size-3.5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
            <NotificationBell />
            <div className="ml-2">
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Link 
                    label="Edit my Profile"
                    labelIcon={<Pencil className="size-4" />}
                    href="/profile"
                  />
                  <UserButton.Link 
                    label="Experience"
                    labelIcon={<Briefcase className="size-4" />}
                    href="/profile#experience"
                  />
                  <UserButton.Link 
                    label="Resume"
                    labelIcon={<FileText className="size-4" />}
                    href="/profile#resume"
                  />
                  <UserButton.Action label="manageAccount" />
                  <UserButton.Action label="signOut" />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-lg md:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {mobileNavItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive
                    ? "text-jade"
                    : "text-muted-foreground"
                  }`}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </main>
  )
}