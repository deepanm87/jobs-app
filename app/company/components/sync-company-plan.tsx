"use client"

import { useAuth } from "@clerk/nextjs"
import { useMutation } from "convex/react"
import { useEffect, useRef } from "react"
import { api } from "@/convex/_generated/api"
import { getErrorMessage } from "@/lib/convex-error"
import { toast } from "sonner"

export function SyncCompanyPlan() {
  const { orgId, has } = useAuth()
  const syncCompanyPlan = useMutation(api.companies.syncCompanyPlan)
  const syncedOrgRef = useRef<string | null>(null)

  useEffect(() => {
    if (!orgId || !has) {
      return
    }

    if (syncedOrgRef.current === orgId) {
      return
    }

    const hasStarterPlan = has({ plan: "starter" }) ?? false
    const hasGrowthPlan = has({ plan: "growth" }) ?? false
    const plan = hasGrowthPlan ? "growth" : hasStarterPlan ? "starter" : "free"
    const seatLimit = plan === "growth" ? 10 : plan === "starter" ? 3 : 1
    const jobLimit = plan === "growth" ? 25 : plan === "starter" ? 5 : 1

    syncedOrgRef.current = orgId
    syncCompanyPlan({
      clerkOrgId: orgId,
      plan,
      seatLimit,
      jobLimit
    }).catch(error => {
      syncedOrgRef.current = null
      toast.error(getErrorMessage(error, "Could not sync company plan."))
    })
  }, [orgId, has, syncCompanyPlan])

  return null
}