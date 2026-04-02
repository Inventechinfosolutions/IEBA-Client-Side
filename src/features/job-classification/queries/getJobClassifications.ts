import { useQuery } from "@tanstack/react-query"

import { jobClassificationKeys } from "../keys"
import { getJobClassifications } from "../api/jobclassification"
import type { GetJobClassificationsParams } from "../types"

export function useGetJobClassifications(params: GetJobClassificationsParams) {
  return useQuery({
    queryKey: jobClassificationKeys.list(params),
    queryFn: () => getJobClassifications(params),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  })
}
