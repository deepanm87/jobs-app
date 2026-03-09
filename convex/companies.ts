import {
  getMyCompanyContext as getMyCompanyContext_impl,
  getCompanyUsage as getCompanyUsage_impl,
  getMyCompanyUsage as getMyCompanyUsage_impl,
  syncCompanyPlan as syncCompanyPlan_impl,
} from "./lib/companies"

// Re-export the queries
export const getMyCompanyContext = getMyCompanyContext_impl
export const getCompanyUsage = getCompanyUsage_impl
export const getMyCompanyUsage = getMyCompanyUsage_impl

// Re-export the mutation
export const syncCompanyPlan = syncCompanyPlan_impl
