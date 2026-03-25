import { useMutation, useQueryClient } from "@tanstack/react-query"

import { settingsKeys } from "@/features/settings/keys"
import { delay, getMockSettings, MOCK_NETWORK_DELAY_MS, setMockSettings } from "@/features/settings/mock"
import type { SettingsModel, UpdateSettingsInput } from "@/features/settings/types"

async function updateSettings(input: UpdateSettingsInput): Promise<SettingsModel> {
  await delay(MOCK_NETWORK_DELAY_MS)

  const current = getMockSettings()
  const normalizedAddresses = (input.values.county.addresses ?? []).map((row) => ({
    location: row.location ?? "",
    street: row.street ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    zip: row.zip ?? "",
  }))
  const next: SettingsModel = {
    version: current.version + 1,
    county: {
      ...current.county,
      ...input.values.county,
      logoDataUrl: input.values.county.logoDataUrl ?? null,
      welcomeMessage: input.values.county.welcomeMessage ?? "",
      addresses: normalizedAddresses,
    },
  }

  setMockSettings(next)
  return next
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => updateSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })
}

