import { useQuery } from "@tanstack/react-query"
import { personalTimeStudyKeys } from "../keys"
import { apiGetDayDetail } from "../api/personalTimeStudyApi"
import type { UserDayLegendDetailResDto } from "../types"

/**
 * Fetches the day details for a specific user and date.
 */
export function useGetPersonalDayDetail(userId: string, dateStr: string, month: number, year: number, enabled: boolean) {
  return useQuery<UserDayLegendDetailResDto>({
    queryKey: personalTimeStudyKeys.dayDetail(userId, dateStr),
    queryFn: () => apiGetDayDetail({ 
      userId, 
      date: dateStr, 
      month, 
      year 
    }),
    enabled: !!userId && enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}
