import { useQuery } from "@tanstack/react-query"

import { apiGetActivityCodesPage } from "../api"
import { masterCodeKeys } from "../keys"
import type { GetMasterCodesParams } from "../types"

export function useGetMasterCodes(params: GetMasterCodesParams) {
  return useQuery({
    queryKey: masterCodeKeys.list(params),
    queryFn: () =>
      apiGetActivityCodesPage({
        codeType: params.codeType!,
        page: params.page,
        pageSize: params.pageSize,
        inactiveOnly: params.inactiveOnly,
      }),
    enabled: Boolean(params.codeType),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
