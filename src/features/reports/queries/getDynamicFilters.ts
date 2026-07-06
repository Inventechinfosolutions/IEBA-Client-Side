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
  apiGetRmtsPayPeriods,
  apiGetCheckDatesFromPayroll,
} from "../api/reports"
import { reportKeys } from "../keys"
import { reportQueryOptions } from "../queryOptions"

export function useGetCheckDatesFromPayroll(
  departmentId: string | undefined,
  fromDate: string | undefined,
  toDate: string | undefined,
  enabled: boolean,
  reportKey: string,
) {
  return useQuery({
    queryKey: [...reportKeys.all, "check-dates-from-payroll", reportKey, { departmentId, fromDate, toDate }],
    queryFn: () => apiGetCheckDatesFromPayroll(departmentId!, fromDate!, toDate!),
    enabled: enabled && !!departmentId && !!fromDate && !!toDate,
    ...reportQueryOptions,
  })
}

export function useGetMaaEmployees(
  activityTypes: string[],
  departmentId: string | undefined,
  enabled: boolean,
  reportKey: string,
) {
  return useQuery({
    queryKey: [...reportKeys.maaEmployees(activityTypes, departmentId), reportKey],
    queryFn: () => apiGetMaaEmployees(activityTypes, departmentId),
    enabled: enabled && !!departmentId,
    ...reportQueryOptions,
  })
}

export function useGetCostPoolUsers(
  costPoolIds: string[],
  userId: string,
  employeeStatus: string[] | undefined,
  enabled: boolean,
  reportKey: string,
) {
  return useQuery({
    queryKey: [...reportKeys.costPoolUsers(costPoolIds, userId, employeeStatus), reportKey],
    queryFn: () => apiGetCostPoolUsers(costPoolIds, userId, employeeStatus),
    enabled: enabled && costPoolIds.length > 0 && !!userId,
    ...reportQueryOptions,
  })
}

export function useGetMaaTcmActivityDepartments(enabled: boolean, reportKey: string) {
  return useQuery({
    queryKey: [...reportKeys.maaTcmActivityDepartments(), reportKey],
    queryFn: () => apiGetMaaTcmActivityDepartments(),
    enabled,
    ...reportQueryOptions,
  })
}

export function useGetListAllPrograms(enabled: boolean, reportKey: string) {
  return useQuery({
    queryKey: [...reportKeys.listAllPrograms(), reportKey],
    queryFn: () => apiGetListAllPrograms(),
    enabled,
    ...reportQueryOptions,
  })
}

export function useGetUsersUnderDepartment(
  departmentId: string | undefined,
  userId: string | undefined,
  masterCode: string | undefined,
  userStatus: string[],
  enabled: boolean,
  reportKey: string,
  fromDate?: string,
  toDate?: string,
) {
  const statusStr = userStatus.length ? userStatus.join(",") : "active"
  return useQuery({
    queryKey: [
      ...reportKeys.all,
      "users-under-department",
      reportKey,
      { departmentId, userId, masterCode, statusStr, fromDate, toDate },
    ],
    queryFn: () => apiGetUsersUnderDepartment(departmentId!, userId || "", masterCode, statusStr, fromDate, toDate),
    enabled: enabled && !!departmentId,
    ...reportQueryOptions,
  })
}

export function useGetActivitiesByDepartmentAndUsers(
  departmentId: string | undefined,
  userIds: string[],
  startDate: string | undefined,
  endDate: string | undefined,
  activityStatus: string,
  masterCode: string | undefined,
  enabled: boolean,
  reportKey: string,
) {
  return useQuery({
    queryKey: [
      ...reportKeys.all,
      "activities-by-dept-users",
      reportKey,
      { departmentId, userIds, startDate, endDate, activityStatus, masterCode },
    ],
    queryFn: () =>
      apiGetActivitiesByDepartmentAndUsers(
        departmentId!,
        userIds,
        startDate,
        endDate,
        activityStatus,
        masterCode,
      ),
    enabled:
      enabled && !!departmentId && userIds.length > 0 && !!startDate && !!endDate,
    ...reportQueryOptions,
  })
}

export function useGetCostPoolsByDepartment(
  departmentId: string | undefined,
  enabled: boolean,
  reportKey: string,
) {
  return useQuery({
    queryKey: [...reportKeys.all, "costpools-by-department", reportKey, { departmentId }],
    queryFn: () => apiGetCostPoolsByDepartment(departmentId!),
    enabled: enabled && !!departmentId,
    ...reportQueryOptions,
  })
}

export function useGetTimeStudyProgramsForUsers(
  userIds: string[],
  dateFrom: string | undefined,
  dateTo: string | undefined,
  enabled: boolean,
  reportKey: string,
) {
  return useQuery({
    queryKey: [...reportKeys.all, "programs-by-users", reportKey, { userIds, dateFrom, dateTo }],
    queryFn: () => apiGetTimeStudyProgramsForUsers(userIds, dateFrom!, dateTo!),
    enabled: enabled && userIds.length > 0 && !!dateFrom && !!dateTo,
    ...reportQueryOptions,
  })
}

export function useGetRmtsPayPeriods(
  fiscalYear: string | undefined,
  departmentId: string | undefined,
  enabled: boolean,
  reportKey: string,
) {
  return useQuery({
    queryKey: [...reportKeys.all, "rmts-pay-periods", reportKey, { fiscalYear, departmentId }],
    queryFn: () => apiGetRmtsPayPeriods(fiscalYear!, departmentId!),
    enabled: enabled && !!fiscalYear && !!departmentId,
    ...reportQueryOptions,
  })
}
