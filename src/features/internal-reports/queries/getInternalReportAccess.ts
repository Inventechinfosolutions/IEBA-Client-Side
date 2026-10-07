import { useQuery } from "@tanstack/react-query"

import { usePermissions } from "@/hooks/usePermissions"

import { internalReportAccessQueryOptions } from "../queryOptions"

/** PKI internal reports are GLOBALADMIN-only; only superadmins ever ask the backend. */
export function useInternalReportAccess(): { allowed: boolean; isLoading: boolean } {
  const { isSuperAdmin } = usePermissions()
  const query = useQuery({ ...internalReportAccessQueryOptions(), enabled: isSuperAdmin })
  return {
    allowed: isSuperAdmin && query.data?.allowed === true,
    isLoading: isSuperAdmin && query.isLoading,
  }
}
