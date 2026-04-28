import { useQuery } from "@tanstack/react-query"

import { userModuleKeys } from "../keys"
import type { GetUserModuleParams, UserModuleListResponse } from "../types"
import { apiGetUserModuleRows } from "../api"

export function useGetUserModuleRows(
  params: GetUserModuleParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: userModuleKeys.list(params),
    queryFn: (): Promise<UserModuleListResponse> => apiGetUserModuleRows(params),
    enabled: options?.enabled ?? true,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  })
}
