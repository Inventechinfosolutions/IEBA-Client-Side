import { useQuery } from "@tanstack/react-query"
import { 
  apiGetMaaEmployees, 
  apiGetCostPoolUsers, 
  apiGetMaaTcmActivityDepartments,
  apiGetListAllPrograms,
  apiGetUsersUnderDepartment,
  apiGetActivitiesByDepartmentAndUsers,
  apiGetCostPoolsByDepartment,
  apiGetTimeStudyProgramsForUsers,
  apiGetRmtsPayPeriods
} from "../api"
import { reportKeys } from "../keys"

export function useGetMaaEmployees(activityTypes: string[], departmentId?: string, enabled = true) {
  return useQuery({
    queryKey: reportKeys.maaEmployees(activityTypes, departmentId),
    queryFn: () => apiGetMaaEmployees(activityTypes, departmentId),
    enabled: enabled && (activityTypes.length > 0 || !!departmentId),
    staleTime: 5 * 60_000,
  })
}

export function useGetCostPoolUsers(costPoolIds: string[], userId: string, employeeStatus?: string[], enabled = true) {
  return useQuery({
    queryKey: reportKeys.costPoolUsers(costPoolIds, userId, employeeStatus),
    queryFn: () => apiGetCostPoolUsers(costPoolIds, userId, employeeStatus),
    enabled: enabled && costPoolIds.length > 0 && !!userId,
    staleTime: 5 * 60_000,
  })
}

export function useGetMaaTcmActivityDepartments(enabled = true) {
  return useQuery({
    queryKey: reportKeys.maaTcmActivityDepartments(),
    queryFn: () => apiGetMaaTcmActivityDepartments(),
    enabled,
    staleTime: 10 * 60_000,
  })
}

export function useGetListAllPrograms(enabled = true) {
  return useQuery({
    queryKey: reportKeys.listAllPrograms(),
    queryFn: () => apiGetListAllPrograms(),
    enabled,
    staleTime: 10 * 60_000,
  })
}

export function useGetUsersUnderDepartment(departmentId: string | undefined, userId: string | undefined, masterCode?: string, enabled = true) {
  return useQuery({
    queryKey: [...reportKeys.all, "users-under-department", { departmentId, userId, masterCode }],
    queryFn: () => apiGetUsersUnderDepartment(departmentId!, userId!, masterCode),
    enabled: enabled && !!departmentId && !!userId,
    staleTime: 5 * 60_000,
  })
}
/** Fetch activities filtered by department + selected employees + date range. */
export function useGetActivitiesByDepartmentAndUsers(
  departmentId: string | undefined,
  userIds: string[],
  startDate?: string,
  endDate?: string,
  activityStatus = "active",
  masterCode?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [...reportKeys.all, "activities-by-dept-users", { departmentId, userIds, startDate, endDate, activityStatus, masterCode }],
    queryFn: () => apiGetActivitiesByDepartmentAndUsers(departmentId!, userIds, startDate, endDate, activityStatus, masterCode),
    enabled: enabled && !!departmentId && userIds.length > 0,
    staleTime: 5 * 60_000,
  })
}
/** Fetch cost pools filtered by department. */
export function useGetCostPoolsByDepartment(departmentId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [...reportKeys.all, "costpools-by-department", { departmentId }],
    queryFn: () => apiGetCostPoolsByDepartment(departmentId!),
    enabled: enabled && !!departmentId,
    staleTime: 5 * 60_000,
  })
}

export function useGetTimeStudyProgramsForUsers(
  userIds: string[],
  dateFrom: string | undefined,
  dateTo: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: [...reportKeys.all, "programs-by-users", { userIds, dateFrom, dateTo }],
    queryFn: () => apiGetTimeStudyProgramsForUsers(userIds, dateFrom!, dateTo!),
    enabled: enabled && userIds.length > 0 && !!dateFrom && !!dateTo,
    staleTime: 0,
  })
}

export function useGetRmtsPayPeriods(
  fiscalYear: string | undefined,
  departmentId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: [...reportKeys.all, "rmts-pay-periods", { fiscalYear, departmentId }],
    queryFn: () => apiGetRmtsPayPeriods(fiscalYear!, departmentId!),
    enabled: enabled && !!fiscalYear && !!departmentId,
    staleTime: 5 * 60_000,
  })
}
