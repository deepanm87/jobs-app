"use client"

import { useAuth } from "@clerk/nextjs"
import { useMutation } from "convex/react"
import { useEffect, useRef } from "react"
import { api } from "@/convex/_generated/api"
import { getErrorMessage } from "@/lib/convex-error"
import { toast } from "sonner"

export function SyncCompanyPlan() {
  const { orgId, has, isLoaded, isSignedIn } = useAuth()
  const syncCompanyPlan = useMutation(api.companies.syncCompanyPlan)
  const syncedOrgRef = useRef<string | null>(null)

  useEffect(() => {
    // Wait for Clerk to fully initialize before calling Convex mutations.
    // Otherwise, `ctx.auth.getUserIdentity()` can be null on the server.
    if (!orgId || !isLoaded || !isSignedIn) {
      return
    }

    if (syncedOrgRef.current === orgId) {
      return
    }

    const hasStarterPlan = has?.({ plan: "starter" }) ?? false
    const hasGrowthPlan = has?.({ plan: "growth" }) ?? false
    const plan = hasGrowthPlan ? "growth" : hasStarterPlan ? "starter" : "free"
    const seatLimit = plan === "growth" ? 10 : plan === "starter" ? 3 : 1
    const jobLimit = plan === "growth" ? 25 : plan === "starter" ? 5 : 1
    const isAdmin = has?.({ role: "org:admin" }) ?? false
    const isRecruiter = has?.({ role: "org:recruiter" }) ?? false
    const role = isAdmin ? "admin" : isRecruiter ? "recruiter" : "member"

    let cancelled = false

    const run = async () => {
      try {
        for (let attempt = 0; attempt < 6; attempt++) {
          if (cancelled) return

          const membershipSynced = await syncCompanyPlan({
            clerkOrgId: orgId,
            plan,
            role,
            seatLimit,
            jobLimit
          })

          if (membershipSynced) {
            syncedOrgRef.current = orgId
            return
          }

          // Back off slightly; this usually only takes a moment
          // for Clerk/Convex auth to become consistent.
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      } catch (error) {
        syncedOrgRef.current = null
        toast.error(getErrorMessage(error, "Could not sync company plan."))
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [orgId, has, isLoaded, isSignedIn, syncCompanyPlan])

  return null
}