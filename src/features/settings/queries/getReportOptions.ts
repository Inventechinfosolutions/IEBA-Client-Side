import { useQuery } from "@tanstack/react-query"

import { settingsKeys } from "@/features/settings/keys"
import { delay, mockReportOptions, MOCK_NETWORK_DELAY_MS } from "@/features/settings/mock"
import type { ReportOption } from "@/features/settings/mock"

async function fetchReportOptions(): Promise<ReportOption[]> {
  await delay(MOCK_NETWORK_DELAY_MS)
  return mockReportOptions
}

export function useReportOptions() {
  return useQuery({
    queryKey: settingsKeys.reports.list(),
    queryFn: fetchReportOptions,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
