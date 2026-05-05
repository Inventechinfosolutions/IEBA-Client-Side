import { useQuery } from "@tanstack/react-query"
import { apiGetTimeEntrySummary } from "../api/personalTimeStudyApi"
import { personalTimeStudyKeys } from "../keys"

export function useGetTimeEntrySummary(userId: string, date: string, screen?: string, enabled = true) {
  return useQuery({
    queryKey: [...personalTimeStudyKeys.timeEntrySummary(userId, date), screen],
    queryFn: () => apiGetTimeEntrySummary(userId, date, screen),
    enabled: enabled && !!userId && !!date,
    staleTime: 0, 
  })
}
