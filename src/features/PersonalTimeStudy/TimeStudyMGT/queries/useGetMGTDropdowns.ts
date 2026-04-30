import { useQuery } from "@tanstack/react-query"
import { timeStudyMGTKeys } from "../keys"
import { apiGetUserProgramsAndActivities } from "../../api/personalTimeStudyApi"

/**
 * Fetches the programs and activities for a specific user in MGT.
 */
export function useGetMGTDropdowns(userId: string | null) {
  return useQuery({
    queryKey: timeStudyMGTKeys.dropdowns(userId ?? ""),
    queryFn: () => apiGetUserProgramsAndActivities(userId!),
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}
