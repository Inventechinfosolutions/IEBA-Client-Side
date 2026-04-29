import { useQuery } from "@tanstack/react-query"
import { timeStudyMGTKeys } from "../keys"
import { apiMgtGetEmployeeList } from "../api/timeStudyMGTApi"

/**
 * Fetches the list of employees for the MGT employee panel.
 * Filtered by optional search string.
 */
export function useGetMGTEmployeeList(search?: string) {
  return useQuery({
    queryKey: timeStudyMGTKeys.employeeList(search),
    queryFn: () => apiMgtGetEmployeeList(search),
    staleTime: 60_000,
  })
}
