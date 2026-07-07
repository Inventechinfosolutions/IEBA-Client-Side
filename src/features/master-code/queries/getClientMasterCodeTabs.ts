import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/contexts/AuthContext"
import { useGetCountyClient } from "@/features/settings/queries/getCountyClient"
import { apiGetClientMasterCodeTabs } from "../api/clientMasterCodeApi"
import { masterCodeKeys } from "../keys"

/** County client master code tab names — replaces `GET /activity-codes/types`. */
export function useGetClientMasterCodeTabs(enabled = true) {
  const { isAuthenticated } = useAuth()
  const countyClientQuery = useGetCountyClient(enabled && isAuthenticated)
  const clientId = countyClientQuery.data?.id

  return useQuery({
    queryKey: masterCodeKeys.clientTabs(clientId ?? 0),
    queryFn: () => apiGetClientMasterCodeTabs(clientId as number),
    enabled: enabled && isAuthenticated && typeof clientId === "number" && clientId >= 1,
    staleTime: 0,
    gcTime: 5 * 60_000,
  })
}
