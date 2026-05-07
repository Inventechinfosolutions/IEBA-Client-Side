import { useQuery } from "@tanstack/react-query"

import { programKeys } from "../keys"
import { apiGetPrograms } from "../api"
import type { GetProgramsParams } from "../types"

export function useGetPrograms(params: GetProgramsParams) {
  return useQuery({
    queryKey: programKeys.list(params),
    queryFn: () => apiGetPrograms(params),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

