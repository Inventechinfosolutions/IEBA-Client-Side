import { useQuery } from "@tanstack/react-query"

import { fetchActivityPicklistForNewPool } from "../api/costPoolApi"
import { costPoolKeys } from "../keys"

export function useCostPoolActivityPicklistQuery(
  departmentId: number,
  options: { enabled: boolean },
) {
  return useQuery({
    queryKey: costPoolKeys.activityPicklist(departmentId),
    queryFn: () => fetchActivityPicklistForNewPool(departmentId),
    enabled: options.enabled && departmentId > 0,
    staleTime: 60_000,
  })
}
