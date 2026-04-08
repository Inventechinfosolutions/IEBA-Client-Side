import { useQuery } from "@tanstack/react-query"

import { fetchCostPoolList } from "../api/costPoolApi"
import { costPoolKeys } from "../keys"
import type { CostPoolListQueryParams } from "../types"

export function useCostPoolListQuery(params: CostPoolListQueryParams) {
  return useQuery({
    queryKey: costPoolKeys.list(params),
    queryFn: () => fetchCostPoolList(params),
    staleTime: 0,
    refetchOnMount: "always",
  })
}
