import { useQuery } from "@tanstack/react-query"
import { personalTimeStudyKeys } from "../keys"
import { apiGetMonthLegend } from "../api/personalTimeStudyApi"
import type { UserMonthLegendResDto } from "../types"

/**
 * Fetches the month legend (day status map) for a given user.
 */
export function useGetPersonalMonthLegend(userId: string, month: number, year: number, enabled: boolean) {
  return useQuery<UserMonthLegendResDto>({
    queryKey: personalTimeStudyKeys.monthLegend(userId, month, year),
    queryFn: () => apiGetMonthLegend({ userId, month, year }),
    enabled: !!userId && enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}
