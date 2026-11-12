import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/contexts/AuthContext"
import { usePermissions } from "@/hooks/usePermissions"

import { internalReportAccessQueryOptions } from "../queryOptions"

/** PKI internal reports: Super Admin, GLOBALADMIN, or userprofile.pki. */
export function useInternalReportAccess(): { allowed: boolean; isLoading: boolean } {
  const { user } = useAuth()
  const { isSuperAdmin } = usePermissions()
  const mayHaveAccess = isSuperAdmin || user?.pki === true
  const query = useQuery({ ...internalReportAccessQueryOptions(), enabled: mayHaveAccess })
  return {
    allowed: mayHaveAccess && query.data?.allowed === true,
    isLoading: mayHaveAccess && query.isLoading,
  }
}
