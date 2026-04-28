import { useQuery } from "@tanstack/react-query"

import { fetchCostPoolList } from "../api/costPoolApi"
import { costPoolKeys } from "../keys"
import type { CostPoolListQueryParams } from "../types"

export function useCostPoolListQuery(
  params: CostPoolListQueryParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: costPoolKeys.list(params),
    queryFn: () => fetchCostPoolList(params),
    enabled: options?.enabled ?? true,
    staleTime: 0,
    refetchOnMount: "always",
  })
}
