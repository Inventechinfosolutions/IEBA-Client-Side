import { useQuery } from "@tanstack/react-query"
import { apiMgtGetMonthLegend } from "../api/timeStudyMGTApi"
import { timeStudyMGTKeys } from "../keys"

export function useGetMGTMonthLegend(userId: string | null, month: number, year: number) {
  return useQuery({
    queryKey: timeStudyMGTKeys.monthLegend(userId, month, year),
    queryFn: () => apiMgtGetMonthLegend(userId!, month, year),
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}
