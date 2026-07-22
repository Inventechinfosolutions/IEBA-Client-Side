import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/contexts/AuthContext"
import { apiGetClientMasterCodeTabs } from "../api/clientMasterCodeApi"

/** County client master code tab names — replaces `GET /activity-codes/types`. */
export function useGetClientMasterCodeTabs(enabled = true) {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ["master-codes", "client-tabs"],
    queryFn: () => apiGetClientMasterCodeTabs(),
    enabled: enabled && isAuthenticated,
    staleTime: 0,
    gcTime: 5 * 60_000,
  })
}
