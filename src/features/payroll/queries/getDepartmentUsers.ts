import { useQuery } from "@tanstack/react-query"
import { payrollKeys } from "../key"
import { fetchDepartmentUsers } from "../api/department-users/departmentUserApi"

export function useGetDepartmentUsers(departmentId: string, fiscalYearId: string) {
  return useQuery({
    queryKey: payrollKeys.departmentUsers(departmentId, fiscalYearId),
    queryFn: () => fetchDepartmentUsers(departmentId),
    enabled: !!departmentId && departmentId !== "all",
    staleTime: 0, // Ensure we check again when filters change
  })
}
