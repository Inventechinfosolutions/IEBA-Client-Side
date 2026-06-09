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

function unwrapActivityBuckets(res: unknown): MasterCodeTransferBuckets {
  const root = res as { data?: MasterCodeTransferBuckets }
  const data = root?.data
  if (data && typeof data === "object" && Array.isArray(data.excluded) && Array.isArray(data.included)) {
    return { excluded: data.excluded, included: data.included }
  }
  return { excluded: [], included: [] }
}

export async function fetchReportActivityBuckets(
  masterCodeIds: number[],
  selectedCodes: string[],
  mode: ReportTransferBucketMode = "include",
): Promise<MasterCodeTransferBuckets> {
  const ids = [...new Set(masterCodeIds)].filter((id) => Number.isFinite(id) && id >= 1)
  if (ids.length === 0) return { excluded: [], included: [] }

  const qs = new URLSearchParams({
    ids: ids.join(","),
    mode,
    status: "active",
  })
  const codes = [...new Set(selectedCodes.map((c) => c.trim()).filter(Boolean))]
  if (codes.length > 0) {
    qs.set("selectedCodes", codes.join(","))
  }

  const res = await api.get<unknown>(`/master-codes/activities?${qs.toString()}`)
  return unwrapActivityBuckets(res)
}

export function useReportActivityBuckets(
  masterCodeIds: string[],
  selectedCodes: string[],
  mode: ReportTransferBucketMode,
  enabled: boolean,
) {
  const numericIds = masterCodeIds
    .map((id) => Number(id))
    .filter((n) => Number.isFinite(n) && n >= 1)
  const idsKey = numericIds.slice().sort((a, b) => a - b).join(",")
  const codesKey = [...new Set(selectedCodes.map((c) => c.trim()).filter(Boolean))]
    .sort()
    .join(",")

  return useQuery({
    queryKey: settingsKeys.reports.activityBuckets(idsKey, codesKey, mode),
    queryFn: () => fetchReportActivityBuckets(numericIds, selectedCodes, mode),
    enabled: enabled && numericIds.length > 0,
    ...SETTINGS_REPORTS_QUERY_OPTIONS,
  })
}
