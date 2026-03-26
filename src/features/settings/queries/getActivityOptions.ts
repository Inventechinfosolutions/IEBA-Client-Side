import { useQuery } from "@tanstack/react-query"

import { settingsKeys } from "@/features/settings/keys"
import { delay, mockActivityOptions, MOCK_NETWORK_DELAY_MS } from "@/features/settings/mock"
import type { ActivityOption } from "@/features/settings/mock"

async function fetchActivityOptions(): Promise<ActivityOption[]> {
  await delay(MOCK_NETWORK_DELAY_MS)
  return mockActivityOptions
}

export function useActivityOptions() {
  return useQuery({
    queryKey: settingsKeys.reports.activities(),
    queryFn: fetchActivityOptions,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
