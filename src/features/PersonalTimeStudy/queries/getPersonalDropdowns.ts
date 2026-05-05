import { useQuery } from "@tanstack/react-query"
import { personalTimeStudyKeys } from "../keys"
import { apiGetUserProgramsAndActivities } from "../api/personalTimeStudyApi"

/**
 * Fetches the programs and activities for a specific user.
 */
export function useGetPersonalDropdowns(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: personalTimeStudyKeys.dropdowns(userId),
    queryFn: () => apiGetUserProgramsAndActivities(userId),
    enabled: !!userId && enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}
