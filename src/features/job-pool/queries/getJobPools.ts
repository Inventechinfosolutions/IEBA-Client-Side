import { useQuery } from "@tanstack/react-query"

import { jobPoolKeys } from "../keys"
import { getMockJobPools } from "../mock"
import type { GetJobPoolsParams } from "../types"

export function useGetJobPools(params: GetJobPoolsParams) {
  return useQuery({
    queryKey: jobPoolKeys.list(params),
    queryFn: () => getMockJobPools(params),
  })
}
