import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type {
  ActivityTransferBuckets,
  MasterCodeTransferBuckets,
  ReportTransferBucketMode,
  ReportTransferFlags,
} from "@/features/settings/components/Reports/reportsTransfer.api.types"
import { settingsKeys } from "@/features/settings/keys"

const SETTINGS_REPORTS_QUERY_OPTIONS = {
  staleTime: 0,
  gcTime: 5 * 60_000,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const

function emptyBuckets(): ReportTransferFlags {
  return {
    masterCodeFlag: { excluded: [], included: [] },
    activityFlag: { excluded: [], included: [] },
  }
}

function isMasterCodeBuckets(value: unknown): value is MasterCodeTransferBuckets {
  return (
    !!value &&
    typeof value === "object" &&
    Array.isArray((value as MasterCodeTransferBuckets).excluded) &&
    Array.isArray((value as MasterCodeTransferBuckets).included)
  )
}

function isActivityBuckets(value: unknown): value is ActivityTransferBuckets {
  return (
    !!value &&
    typeof value === "object" &&
    Array.isArray((value as ActivityTransferBuckets).excluded) &&
    Array.isArray((value as ActivityTransferBuckets).included)
  )
}

function unwrapReportTransferFlags(res: unknown): ReportTransferFlags {
  const data = (res as { data?: unknown })?.data
  if (!data || typeof data !== "object") return emptyBuckets()

  const root = data as Record<string, unknown>

  if (isMasterCodeBuckets(root.masterCodeFlag) && isActivityBuckets(root.activityFlag)) {
    return {
      masterCodeFlag: root.masterCodeFlag,
      activityFlag: root.activityFlag,
    }
  }

  if (isMasterCodeBuckets(root)) {
    return {
      masterCodeFlag: root,
      activityFlag: { excluded: [], included: [] },
    }
  }

  return emptyBuckets()
}

export type FetchReportTransferFlagsParams = {
  masterCodeMode: ReportTransferBucketMode
  selectedMasterCodeIds: number[]
  activityMode: ReportTransferBucketMode
  selectedActivityCodes: string[]
  excludedActivityCodes?: string[]
}

export async function fetchReportTransferFlags(
  params: FetchReportTransferFlagsParams,
): Promise<ReportTransferFlags> {
  const selectedIds = [...new Set(params.selectedMasterCodeIds)].filter(
    (id) => Number.isFinite(id) && id >= 1,
  )

  const searchParams = new URLSearchParams({
    status: "active",
    masterCodeMode: params.masterCodeMode,
    activityMode: params.activityMode,
  })

  let url = `/master-codes/activities?${searchParams.toString()}`

  if (selectedIds.length > 0) {
    url += `&selectedIds=${selectedIds.join(",")}`
  }

  const selectedCodes = [...new Set(params.selectedActivityCodes.map((c) => c.trim()).filter(Boolean))]
  if (selectedCodes.length > 0) {
    url += `&selectedCodes=${selectedCodes.join(",")}`
  }

  const excludedCodes = [
    ...new Set((params.excludedActivityCodes ?? []).map((c) => c.trim()).filter(Boolean)),
  ]
  if (excludedCodes.length > 0) {
    url += `&excludedCodes=${excludedCodes.join(",")}`
  }

  const res = await api.get<unknown>(url)
  return unwrapReportTransferFlags(res)
}

export function useReportTransferFlags(
  params: FetchReportTransferFlagsParams,
  enabled: boolean,
) {
  const selectedIdsKey = params.selectedMasterCodeIds
    .slice()
    .sort((a, b) => a - b)
    .join(",")
  const selectedCodesKey = [...new Set(params.selectedActivityCodes.map((c) => c.trim()).filter(Boolean))]
    .sort()
    .join(",")
  const excludedCodesKey = [
    ...new Set((params.excludedActivityCodes ?? []).map((c) => c.trim()).filter(Boolean)),
  ]
    .sort()
    .join(",")

  return useQuery({
    queryKey: settingsKeys.reports.transferFlags(
      params.masterCodeMode,
      selectedIdsKey,
      params.activityMode,
      selectedCodesKey,
      excludedCodesKey,
    ),
    queryFn: () => fetchReportTransferFlags(params),
    enabled,
    ...SETTINGS_REPORTS_QUERY_OPTIONS,
  })
}
