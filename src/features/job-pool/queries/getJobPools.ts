import { useQuery } from "@tanstack/react-query"

import { jobPoolKeys } from "../keys"
import { getJobPools } from "../api/jobpool"
import type { GetJobPoolsParams } from "../types"

export function useGetJobPools(params: GetJobPoolsParams) {
  return useQuery({
    queryKey: jobPoolKeys.list(params),
    queryFn: () => getJobPools(params),
    // Always fetch fresh data whenever Job Pool page is opened.
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  })
}
