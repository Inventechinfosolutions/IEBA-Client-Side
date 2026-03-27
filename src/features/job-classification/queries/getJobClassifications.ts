import { useQuery } from "@tanstack/react-query"

import { jobClassificationKeys } from "../keys"
import { getMockJobClassifications } from "../mock"
import type { GetJobClassificationsParams } from "../types"

export function useGetJobClassifications(params: GetJobClassificationsParams) {
  return useQuery({
    queryKey: jobClassificationKeys.list(params),
    queryFn: () => getMockJobClassifications(params),
  })
}
