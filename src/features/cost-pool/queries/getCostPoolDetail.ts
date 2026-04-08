import { useQuery } from "@tanstack/react-query"

import { fetchCostPoolDetail } from "../api/costPoolApi"
import { costPoolKeys } from "../keys"

type UseCostPoolDetailQueryOptions = {
  enabled: boolean
 
  refetchOnMountAlways?: boolean
}

export function useCostPoolDetailQuery(id: number, options: UseCostPoolDetailQueryOptions) {
  return useQuery({
    queryKey: costPoolKeys.detail(id),
    queryFn: () => fetchCostPoolDetail(id),
    enabled: options.enabled && id > 0,
    ...(options.refetchOnMountAlways ? { refetchOnMount: "always" as const } : {}),
  })
}
