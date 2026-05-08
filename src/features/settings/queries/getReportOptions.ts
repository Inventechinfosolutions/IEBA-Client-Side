import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { settingsKeys } from "@/features/settings/keys"
import type { ReportOption } from "@/features/settings/types"

async function fetchReportOptions(): Promise<ReportOption[]> {
  try {
    const res = await api.get<any>("/report")
    const items = res.data?.data?.items ?? res.data?.data ?? res.data ?? []
    return items.map((r: any) => ({
      key: r.code,
      label: `${r.code} ${r.name}`,
      id: r.id,
      criteria: r.criteria,
      type: r.type,
      reportdata: r.reportdata,
      filename: r.filename,
      path: r.path,
      status: r.status
    }))
  } catch (error) {
    console.error("Failed to fetch report options:", error)
    return []
  }
}

export function useReportOptions() {
  return useQuery({
    queryKey: settingsKeys.reports.list(),
    queryFn: fetchReportOptions,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
