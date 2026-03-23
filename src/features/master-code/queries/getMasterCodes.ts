import { useQuery } from "@tanstack/react-query"

import { masterCodeKeys } from "../keys"
import {
  DEFAULT_ACTIVITY_DESCRIPTION,
  MOCK_NETWORK_DELAY_MS,
  delay,
  filterRows,
  mockMasterCodeRows,
} from "../mock"
import type { GetMasterCodesParams, MasterCodeListResponse } from "../types"

async function fetchMasterCodes(
  params: GetMasterCodesParams,
): Promise<MasterCodeListResponse> {
  await delay(MOCK_NETWORK_DELAY_MS)

  const filteredRows = filterRows(mockMasterCodeRows, params.inactiveOnly)
  const normalizedRows = filteredRows.map((row) => ({
    ...row,
    activityDescription:
      row.activityDescription && row.activityDescription.trim().length > 0
        ? row.activityDescription
        : DEFAULT_ACTIVITY_DESCRIPTION,
  }))
  const start = (params.page - 1) * params.pageSize
  const end = start + params.pageSize

  return {
    items: normalizedRows.slice(start, end),
    totalItems: normalizedRows.length,
  }
}

export function useGetMasterCodes(params: GetMasterCodesParams) {
  return useQuery({
    queryKey: masterCodeKeys.list(params),
    queryFn: () => fetchMasterCodes(params),
  })
}
