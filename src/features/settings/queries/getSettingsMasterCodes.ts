import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { mapMasterCodesResponseToOptions } from "@/features/settings/lib/masterCodeOptions.utils"
import { settingsKeys } from "@/features/settings/keys"

const SETTINGS_REPORTS_QUERY_OPTIONS = {
  staleTime: 0,
  gcTime: 5 * 60_000,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const

async function fetchSettingsMasterCodes() {
  const res = await api.get<unknown>("/master-codes?page=1&limit=100")
  return mapMasterCodesResponseToOptions(res)
}

/** `GET /master-codes` — after a report is selected on Settings → Reports. */
export function useSettingsMasterCodes(enabled = false) {
  return useQuery({
    queryKey: settingsKeys.reports.masterCodes(),
    queryFn: fetchSettingsMasterCodes,
    enabled,
    ...SETTINGS_REPORTS_QUERY_OPTIONS,
  })
}
