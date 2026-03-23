import { useQuery } from "@tanstack/react-query"

import { userModuleKeys } from "../keys"
import { MOCK_NETWORK_DELAY_MS, delay, filterRows, mockUserRows } from "../mock"
import type { GetUserModuleParams, UserModuleListResponse } from "../types"

async function fetchUserModuleRows(
  params: GetUserModuleParams,
): Promise<UserModuleListResponse> {
  await delay(MOCK_NETWORK_DELAY_MS)

  const filtered = filterRows(mockUserRows, params.inactiveOnly)
  const start = (params.page - 1) * params.pageSize
  const end = start + params.pageSize

  return {
    items: filtered.slice(start, end),
    totalItems: filtered.length,
  }
}

export function useGetUserModuleRows(params: GetUserModuleParams) {
  return useQuery({
    queryKey: userModuleKeys.list(params),
    queryFn: () => fetchUserModuleRows(params),
  })
}
