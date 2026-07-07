import { useQuery } from "@tanstack/react-query"

import { apiGetClientMasterCodes } from "@/features/master-code/api/clientMasterCodeApi"
import { settingsKeys } from "@/features/settings/keys"

const SETTINGS_MASTER_CODE_QUERY_OPTIONS = {
  staleTime: 0,
  gcTime: 5 * 60_000,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const

/** `GET /client/:clientId/master-codes` — when Settings → Master Code section is expanded. */
export function useSettingsMasterCodeList(clientId: number | undefined, enabled = false) {
  const canFetch = enabled && typeof clientId === "number" && clientId >= 1

  return useQuery({
    queryKey: canFetch
      ? settingsKeys.masterCode.list(clientId)
      : ([...settingsKeys.masterCode.all(), "list", "idle"] as const),
    queryFn: () => apiGetClientMasterCodes(clientId as number),
    enabled: canFetch,
    ...SETTINGS_MASTER_CODE_QUERY_OPTIONS,
  })
}
