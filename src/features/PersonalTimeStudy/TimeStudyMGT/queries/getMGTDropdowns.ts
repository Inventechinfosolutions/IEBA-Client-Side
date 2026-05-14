import { useQuery } from "@tanstack/react-query"
import { apiMgtGetUserProgramsAndActivities } from "../api/timeStudyMGTApi"
import { timeStudyMGTKeys } from "../keys"

export function useGetMGTDropdowns(userId: string | null) {
  return useQuery({
    queryKey: timeStudyMGTKeys.dropdowns(userId ?? ""),
    queryFn: () => apiMgtGetUserProgramsAndActivities(userId!),
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}
