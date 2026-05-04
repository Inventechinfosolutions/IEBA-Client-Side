import { useQuery } from "@tanstack/react-query"
import { apiGetTimeEntrySummary } from "../api/personalTimeStudyApi"
import { personalTimeStudyKeys } from "../keys"

export function useGetTimeEntrySummary(userId: string, date: string, enabled = true) {
  return useQuery({
    queryKey: [...personalTimeStudyKeys.all, "timeentry-summary", userId, date],
    queryFn: () => apiGetTimeEntrySummary(userId, date),
    enabled: enabled && !!userId && !!date,
    staleTime: 0, // Keep it fresh
  })
}
