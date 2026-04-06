import { useQuery } from "@tanstack/react-query"

import { apiGetCountyActivityForEdit } from "../api/countyActivityApi"
import { countyActivityCodeKeys } from "../keys"

export function useCountyActivityForEdit(activityId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: activityId
      ? countyActivityCodeKeys.activityDetail(activityId)
      : [...countyActivityCodeKeys.all, "activity-detail", "idle"] as const,
    queryFn: () => apiGetCountyActivityForEdit(Number(activityId)),
    enabled: Boolean(enabled && activityId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
