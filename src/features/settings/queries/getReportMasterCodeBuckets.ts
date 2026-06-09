import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type {
  MasterCodeTransferBuckets,
  ReportTransferBucketMode,
} from "@/features/settings/components/Reports/reportsTransfer.api.types"
import { settingsKeys } from "@/features/settings/keys"

const SETTINGS_REPORTS_QUERY_OPTIONS = {
  staleTime: 0,
  gcTime: 5 * 60_000,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const

function unwrapMasterCodeBuckets(res: unknown): MasterCodeTransferBuckets {
  const root = res as { data?: MasterCodeTransferBuckets }
  const data = root?.data
  if (data && typeof data === "object" && Array.isArray(data.excluded) && Array.isArray(data.included)) {
    return { excluded: data.excluded, included: data.included }
  }
  return { excluded: [], included: [] }
}

export async function fetchReportMasterCodeBuckets(
  selectedIds: number[],
  mode: ReportTransferBucketMode = "include",
): Promise<MasterCodeTransferBuckets> {
  const ids = [...new Set(selectedIds)].filter((id) => Number.isFinite(id) && id >= 1)
  const qs = new URLSearchParams({
    page: "1",
    limit: "1000",
    mode,
  })
  if (ids.length > 0) {
    qs.set("selectedIds", ids.join(","))
  }
  const res = await api.get<unknown>(`/master-codes?${qs.toString()}`)
  return unwrapMasterCodeBuckets(res)
}

export function useReportMasterCodeBuckets(
  selectedIds: string[],
  mode: ReportTransferBucketMode,
  enabled: boolean,
) {
  const numericIds = selectedIds
    .map((id) => Number(id))
    .filter((n) => Number.isFinite(n) && n >= 1)
  const idsKey = numericIds.slice().sort((a, b) => a - b).join(",")

  return useQuery({
    queryKey: settingsKeys.reports.masterCodeBuckets(idsKey, mode),
    queryFn: () => fetchReportMasterCodeBuckets(numericIds, mode),
    enabled,
    ...SETTINGS_REPORTS_QUERY_OPTIONS,
  })
}
