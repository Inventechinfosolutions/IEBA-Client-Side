import { useQuery } from "@tanstack/react-query"

import { fetchMasterCodes, type GetMasterCodesParams } from "../api"
import { masterCodeKeys } from "../keys"

export function useGetMasterCodes(params: GetMasterCodesParams) {
  return useQuery({
    queryKey: masterCodeKeys.list(params),
    queryFn: () => fetchMasterCodes(params),
  })
}
