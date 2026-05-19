import { useQuery } from "@tanstack/react-query"
import { dashboardKeys } from "../keys"
import {
  getReportsByRole,
  getDashboardOverview,
} from "../api/dashboard"
import type {
  DashboardOverview,
  ReportItem,
} from "../types"

const STALE_TIME = 0
const GC_TIME = 300_000 // 5 minutes

const staleOptions = {
  staleTime: STALE_TIME,
  gcTime: GC_TIME,
  refetchOnMount: true as const,
  refetchOnWindowFocus: false as const,
  retry: false as const,
}

export function useReportsByRole(params?: {
  departmentId?: number
  roleId?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: [...dashboardKeys.reports(), params],
    queryFn: () => getReportsByRole(params),
    select(data: ReportItem[]) {
      return data
    },
    enabled: params?.enabled !== false,
    ...staleOptions,
  })
}

export function useDashboardOverview(options?: {
  userId?: string | number
  departmentId?: number
  roleId?: number
  enabled?: boolean
}) {
  return useQuery<DashboardOverview>({
    queryKey: [...dashboardKeys.overview(), { userId: options?.userId, departmentId: options?.departmentId, roleId: options?.roleId }],
    queryFn: () => getDashboardOverview({ userId: options?.userId, departmentId: options?.departmentId, roleId: options?.roleId }),
    enabled: options?.enabled,
    ...staleOptions,
  })
}
