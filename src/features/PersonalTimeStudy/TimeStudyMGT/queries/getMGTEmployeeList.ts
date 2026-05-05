import { useQuery } from "@tanstack/react-query"
import { apiMgtGetEmployeeList } from "../api/timeStudyMGTApi"
import { timeStudyMGTKeys } from "../keys"

/**
 * Hook to fetch the employee list for the MGT dashboard.
 * @param search - Optional name search string
 * @param departmentIds - Optional comma-separated department IDs for filtering
 * @param enabled - Whether the query is active (defaults to true)
 */
export function useGetMGTEmployeeList(search?: string, departmentIds?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: timeStudyMGTKeys.employeeList(search, departmentIds),
    queryFn: () => apiMgtGetEmployeeList(search, departmentIds),
    enabled: !!enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}
