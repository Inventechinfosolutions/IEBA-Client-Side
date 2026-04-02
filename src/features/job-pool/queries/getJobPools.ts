import { useQuery } from "@tanstack/react-query"

import { jobPoolKeys } from "../keys"
import { getJobPools } from "../api/jobpool"
import type { GetJobPoolsParams } from "../types"

export function useGetJobPools(params: GetJobPoolsParams) {
  return useQuery({
    queryKey: jobPoolKeys.list(params),
    queryFn: () => getJobPools(params),
  })
}
