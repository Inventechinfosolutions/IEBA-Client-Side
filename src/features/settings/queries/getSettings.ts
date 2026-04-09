import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { settingsKeys } from "@/features/settings/keys"
import { delay, getMockSettings, MOCK_NETWORK_DELAY_MS } from "@/features/settings/mock"
import type { SettingsResponse } from "@/features/settings/types"

async function fetchSettings(): Promise<SettingsResponse> {
  // Settings API integration is still in progress.
  // We keep the existing mock for non-county sections and hydrate county from the Client API
  // at the form level when the County accordion is opened.
  await delay(MOCK_NETWORK_DELAY_MS)
  return getMockSettings()
}

export function useGetSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: fetchSettings,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}

