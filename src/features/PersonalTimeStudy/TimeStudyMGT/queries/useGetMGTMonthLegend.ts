import { useQuery } from "@tanstack/react-query"
import { timeStudyMGTKeys } from "../keys"
import { apiMgtGetMonthLegend } from "../api/timeStudyMGTApi"

/**
 * Fetches the month legend (day status map) for a given user.
 * Only runs when a userId is selected.
 */
export function useGetMGTMonthLegend(
  userId: string | null,
  month: number,
  year: number
) {
  return useQuery({
    queryKey: timeStudyMGTKeys.monthLegend(userId ?? "", month, year),
    queryFn: () => apiMgtGetMonthLegend(userId!, month, year),
    enabled: !!userId,
    staleTime: 30_000,
  })
}
