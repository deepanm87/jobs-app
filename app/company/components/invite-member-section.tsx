"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { AlertTriangle, UserPlus } from "lucide-react"
import { inviteOrganizationMember } from "../actions"

const ROLES = [
  { value: "org:member", label: "Member" },
  { value: "org:admin", label: "Admin" },
  { value: "org:recruiter", label: "Recruiter" }
] as const

export function InviteMemberSection() {
  const { orgId, has } = useAuth()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("org:member")
  const [status, setStatus] = useState<"idle" | "loading"| "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const companyContext = useQuery(
    api.companies.getMyCompanyContext,
    orgId ? { clerkOrgId: orgId } : "skip"
  )
  const usage = useQuery(
    api.companies.getCompanyUsage,
    companyContext ? { companyId: companyContext.companyId } : "skip"
  )

  const canInvite = has?.({ permission: "org:team_management:invite" }) ?? false
  const hasTeamManagement = has?.({ feature: "team_management" }) ?? false
  const seatLimit = companyContext?.seatLimit ?? 1
  const atSeatLimit = 
    usage !== undefined &&
    usage !== null &&
    usage.activeMemberCount + usage.invitedMemberCount >= seatLimit

  const isLoadingUsage = usage === undefined
  const isLoadingContext = companyContext === undefined
  const activeCount = usage?.activeMemberCount ?? 0
  const invitedCount = usage?.invitedMemberCount ?? 0
  const seatsUsedForBar = usage?.activeMemberCount ?? 0
  const ratio = Math.min(100, Math.round((seatsUsedForBar / Math.max(1, seatLimit)) * 100))
  const overLimit = seatsUsedForBar > seatLimit
  const nearLimit = ratio >= 80 && !overLimit

  if (!canInvite || !hasTeamManagement) {
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setMessage("")
    const appOrigin = typeof window !== "undefined" ? window.location.origin : undefined
    const result = await inviteOrganizationMember(
      email.trim(),
      role,
      appOrigin
    )
    if (result.success) {
      setStatus("success")
      setMessage("Invitation sent. They'll receive an email to join.")
      setEmail("")
    } else {
      setStatus("error")
      setMessage(result.error)
    }
  }

  return (
    <Card className="warm-shadow">
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center gap-2 font-(family-name:var(--font-bricolage) text-lg tracking-tight">
          <UserPlus className="size-4 text-jade" />
          Invite team member
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {atSeatLimit
            ? "Seat limit reached. Upgrade to invite more."
            : "Send an invitation to join this workspace."
          }
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Team members</span>
            <span className="font-(family-name:var(--font-bricolage) text-lg font-bold">
              {isLoadingUsage || isLoadingContext ? "-" : activeCount}
              <span className="text-muted-foreground">
                {" "}
                of {isLoadingContext ? "-" : seatLimit}
              </span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div 
              className={`h-2 rounded-full transition-all ${
                overLimit
                  ? "bg-amber-accent"
                  : nearLimit
                    ? "bg-amber-accent"
                    : "bg-jade"
                }`}
              style={{
                width: isLoadingUsage || isLoadingContext ? "0%" : `${ratio}%`
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {invitedCount > 0 ? `${invitedCount} invited pending` : "\u00A0"}
            </p>
            {overLimit && (
              <p className="flex items-center gap-1 text-xs font-medium text-amber-accent">
                <AlertTriangle className="size-3" />
                Over limit
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input 
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={atSeatLimit}
              className="max-w-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={role}
              onValueChange={setRole}
              disabled={atSeatLimit}
            >
              <SelectTrigger id="invite-role" className="max-w-sm">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" size="sm" disabled={atSeatLimit || status === "loading"}>
            {status === "loading" ? "Sending..." : "Send invitation"}
          </Button>
          {message && (
            <p className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
              {message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}