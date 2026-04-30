import { useQuery } from "@tanstack/react-query"
import { timeStudyMGTKeys } from "../keys"
import { apiGetDayDetail } from "../../api/personalTimeStudyApi"

/**
 * Fetches the day details for a specific user and date in MGT.
 */
export function useGetMGTDayDetail(
  userId: string | null,
  dateStr: string | null,
  month: number,
  year: number
) {
  return useQuery({
    queryKey: timeStudyMGTKeys.dayDetail(userId ?? "", dateStr ?? ""),
    queryFn: () => apiGetDayDetail({ userId: userId!, date: dateStr!, month, year }),
    enabled: !!userId && !!dateStr,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}
