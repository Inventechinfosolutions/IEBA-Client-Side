import { useQuery } from "@tanstack/react-query"
import { timeStudyMGTKeys } from "../keys"
import { apiMgtGetEmployeeList } from "../api/timeStudyMGTApi"

/**
 * Fetches the list of employees for the MGT employee panel.
 * Filtered by optional search string.
 */
export function useGetMGTEmployeeList(search?: string, departmentId?: string) {
  return useQuery({
    queryKey: [...timeStudyMGTKeys.employeeList(search), departmentId],
    queryFn: () => apiMgtGetEmployeeList(search, departmentId),
    staleTime: 60_000,
  })
}
