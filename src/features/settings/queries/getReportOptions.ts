import { useQuery } from "@tanstack/react-query"

import { settingsKeys } from "@/features/settings/keys"
import { REPORT_OPTIONS } from "@/features/settings/constants"
import type { ReportOption } from "@/features/settings/types"

async function fetchReportOptions(): Promise<ReportOption[]> {
  return REPORT_OPTIONS
}

export function useReportOptions() {
  return useQuery({
    queryKey: settingsKeys.reports.list(),
    queryFn: fetchReportOptions,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
