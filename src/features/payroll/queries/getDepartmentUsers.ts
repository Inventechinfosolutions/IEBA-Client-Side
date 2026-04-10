import { useQuery } from "@tanstack/react-query"
import { payrollKeys } from "../key"
import { fetchDepartmentUsers } from "../api/payrollApi"

export function useGetDepartmentUsers(departmentId: string) {
  return useQuery({
    queryKey: payrollKeys.departmentUsers(departmentId),
    queryFn: () => fetchDepartmentUsers(departmentId),
    enabled: !!departmentId && departmentId !== "all",
    staleTime: 5 * 60 * 1000,
  })
}
