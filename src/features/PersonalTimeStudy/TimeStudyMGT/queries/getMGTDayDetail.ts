import { useQuery } from "@tanstack/react-query"
import { apiMgtGetDayDetail } from "../api/timeStudyMGTApi"
import { timeStudyMGTKeys } from "../keys"

export function useGetMGTDayDetail(userId: string | null, date: string | null, month: number, year: number) {
  return useQuery({
    queryKey: timeStudyMGTKeys.dayDetail(userId, date),
    queryFn: () => apiMgtGetDayDetail({ userId: userId!, date: date!, month, year }),
    enabled: !!userId && !!date,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}
