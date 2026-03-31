import { useQuery } from "@tanstack/react-query"

import { apiGetActivityCodesPage } from "../api"
import { masterCodeKeys } from "../keys"
import type { GetMasterCodesParams } from "../types"

export function useGetMasterCodes(params: GetMasterCodesParams) {
  return useQuery({
    queryKey: masterCodeKeys.list(params),
    queryFn: () => {
      const { codeType, page, pageSize, inactiveOnly } = params
      if (!codeType) throw new Error("codeType is required")
      return apiGetActivityCodesPage({
        codeType,
        page,
        pageSize,
        inactiveOnly,
      })
    },
    enabled: Boolean(params.codeType),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
