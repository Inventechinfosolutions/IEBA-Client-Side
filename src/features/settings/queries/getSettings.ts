import { useQuery } from "@tanstack/react-query"

import { settingsKeys } from "@/features/settings/keys"
import { delay, getMockSettings, MOCK_NETWORK_DELAY_MS } from "@/features/settings/mock"
import type { SettingsResponse } from "@/features/settings/types"

async function fetchSettings(): Promise<SettingsResponse> {
  await delay(MOCK_NETWORK_DELAY_MS)
  return getMockSettings()
}

export function useGetSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: () => fetchSettings(),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

