import { useQuery } from "@tanstack/react-query"

import { apiGetUserModuleRows } from "../../api"
import { userModuleKeys } from "../../keys"
import type { GetUserModuleParams, UserModuleListResponse } from "../../types"

import {
  fetchActivityDepartmentsForDepartment,
  fetchAddEmployeeActivitiesCatalog,
  fetchAddEmployeeDepartments,
  fetchAddEmployeeJobClassifications,
  fetchAddEmployeeJobPools,
  fetchDepartmentRolesCatalog,
  fetchSecurityDepartmentRoles,
  fetchListCountyActivity,
  fetchAddEmployeeLocations,
  fetchMulticodeMasterCodes,
  fetchSupervisorsByDepartmentIds,
  fetchUserProgramsAndActivities,
  fetchUserDetailsTab,
} from "../api"
import { addEmployeeLookupKeys } from "../keys"
import type {
  AddEmployeeActivityCatalogRow,
  AddEmployeeActivityDepartmentRow,
  AddEmployeeCountyActivityRow,
  AddEmployeeDepartmentOption,
  AddEmployeeJobClassificationRow,
  AddEmployeeJobPoolRow,
  AddEmployeeLocationRow,
  AddEmployeeMasterCodeRow,
  AddEmployeeSecurityRoleCatalogItem,
  SecurityDepartmentRolesQueryResult,
  AddEmployeeDepartmentSupervisorRow,
  UserProgramsActivitiesDepartmentBundle,
} from "../types"

export function useGetEmployees(
  params: GetUserModuleParams,
  options?: { enabled?: boolean },
) {
  const listParams = {
    page: params.page,
    pageSize: params.pageSize,
    inactiveOnly: params.inactiveOnly,
    sort: params.sort ?? "ASC",
  }
  return useQuery({
    queryKey: userModuleKeys.list(listParams),
    queryFn: (): Promise<UserModuleListResponse> => apiGetUserModuleRows({ ...params, sort: listParams.sort }),
    enabled: options?.enabled !== false,
  })
}

export function useGetAddEmployeeJobClassifications(enabled = true) {
  return useQuery({
    queryKey: addEmployeeLookupKeys.jobClassifications(),
    queryFn: async (): Promise<AddEmployeeJobClassificationRow[]> => {
      return await fetchAddEmployeeJobClassifications()
    },
    enabled,
  })
}

/*Locations for the Employee/Login Details tab. Enable only while that section is mounted*/
export function useGetAddEmployeeLocations(enabled: boolean) {
  return useQuery({
    queryKey: addEmployeeLookupKeys.locations(),
    queryFn: async (): Promise<AddEmployeeLocationRow[]> => {
      return await fetchAddEmployeeLocations()
    },
    enabled,
    staleTime: 60_000,
  })
}

export function useGetAddEmployeeJobPools() {
  return useQuery({
    queryKey: addEmployeeLookupKeys.jobPools(),
    queryFn: async (): Promise<AddEmployeeJobPoolRow[]> => {
      return await fetchAddEmployeeJobPools()
    },
  })
}

/** Prefetch active activity codes (county activity catalog) when Add Employee opens. */
export function useGetAddEmployeeCountyActivities() {
  return useQuery({
    queryKey: addEmployeeLookupKeys.countyActivityList(),
    queryFn: async (): Promise<AddEmployeeCountyActivityRow[]> => {
      return await fetchListCountyActivity()
    },
  })
}

export function useGetAddEmployeeActivitiesCatalog(enabled = true) {
  return useQuery({
    queryKey: addEmployeeLookupKeys.activitiesCatalog(),
    queryFn: async (): Promise<AddEmployeeActivityCatalogRow[]> => {
      return await fetchAddEmployeeActivitiesCatalog()
    },
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}

/** Time Study tab: activities for `departmentId` as ActivityDepartment link rows (ids for assign/unassign activity). */
export function useGetActivityDepartmentsForDepartment(
  departmentId: number | null,
  enabled: boolean,
) {
  const id = departmentId != null && departmentId >= 1 ? departmentId : null
  return useQuery({
    queryKey: addEmployeeLookupKeys.activityDepartmentsByDepartment(id != null ? String(id) : "none"),
    queryFn: async (): Promise<AddEmployeeActivityDepartmentRow[]> => {
      return await fetchActivityDepartmentsForDepartment(id!)
    },
    enabled: Boolean(enabled && id != null),
  })
}

export function useGetAddEmployeeDepartments(enabled = true) {
  return useQuery({
    queryKey: addEmployeeLookupKeys.departments(),
    queryFn: async (): Promise<AddEmployeeDepartmentOption[]> => {
      return await fetchAddEmployeeDepartments()
    },
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}

export function useGetDepartmentRolesCatalog() {
  return useQuery({
    queryKey: addEmployeeLookupKeys.departmentRolesCatalog(),
    queryFn: async (): Promise<AddEmployeeSecurityRoleCatalogItem[]> => {
      return await fetchDepartmentRolesCatalog()
    },
  })
}

/**
 * Security tab: GET /departments/assignedDepartment/roles when `userId` is set.
 * Add flow before draft id: falls back to department-roles catalog as all-unassigned.
 */
export function useGetSecurityDepartmentRoles(
  userId: string | null | undefined,
  allowCatalogWithoutUserId: boolean,
) {
  const id = userId?.trim() ?? ""
  const catalogQuery = useQuery({
    queryKey: addEmployeeLookupKeys.departmentRolesCatalog(),
    queryFn: async (): Promise<SecurityDepartmentRolesQueryResult> => ({
      unassigned: await fetchDepartmentRolesCatalog(),
      assignedSnapshots: [],
    }),
    enabled: allowCatalogWithoutUserId && !id,
    retry: 1,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const userRolesQuery = useQuery({
    queryKey: addEmployeeLookupKeys.securityDepartmentRoles(id),
    queryFn: async (): Promise<SecurityDepartmentRolesQueryResult> => {
      return await fetchSecurityDepartmentRoles(id)
    },
    enabled: Boolean(id),
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  if (id) return userRolesQuery
  return catalogQuery
}

/** @deprecated Use useGetSecurityDepartmentRoles */
export function useGetDepartmentRolesUnassigned(
  userId: string | null | undefined,
  allowFetchWithoutUserId: boolean,
) {
  const query = useGetSecurityDepartmentRoles(userId, allowFetchWithoutUserId)
  return {
    ...query,
    data: query.data?.unassigned,
  }
}

/** Time Study tab: department list (no `departmentId` query param). */
export function useGetUserProgramsActivitiesDepartmentScope(
  userId: string | null | undefined,
  enabled: boolean,
) {
  const id = userId?.trim() ?? ""
  const key = id || "__none__"
  return useQuery({
    queryKey: addEmployeeLookupKeys.userProgramsActivities(key, "__scope__"),
    queryFn: async (): Promise<UserProgramsActivitiesDepartmentBundle[]> => {
      return await fetchUserProgramsAndActivities(id)
    },
    enabled: Boolean(id) && enabled,
    staleTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

/** Time Study tab: programs for one department (`departmentId` query param). */
export function useGetUserProgramsAndActivities(
  userId: string | null | undefined,
  departmentId: number | null | undefined,
  enabled: boolean,
) {
  const id = userId?.trim() ?? ""
  const key = id || "__none__"
  const dept =
    departmentId != null && Number.isFinite(departmentId) && departmentId >= 1
      ? departmentId
      : null
  return useQuery({
    queryKey: addEmployeeLookupKeys.userProgramsActivities(key, dept != null ? String(dept) : "__none__"),
    queryFn: async (): Promise<UserProgramsActivitiesDepartmentBundle[]> => {
      return await fetchUserProgramsAndActivities(id, dept!)
    },
    enabled: Boolean(id) && enabled && dept != null,
    staleTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

/** Loads tenant master codes when Allow MultiCodes is on; list is filtered to allowMulticode + active. */
export function useGetMulticodeMasterCodes(enabled: boolean) {
  return useQuery({
    queryKey: addEmployeeLookupKeys.multicodeMasterCodes(),
    queryFn: async (): Promise<AddEmployeeMasterCodeRow[]> => {
      return await fetchMulticodeMasterCodes()
    },
    enabled,
  })
}

/**
 * Supervisor tab: supervisors eligible in the given departments (GET /users/supervisors?departmentIds=…).
 * Cached for the session: saving the user form should not refetch the same department set (list rarely changes).
 */
export function useGetSupervisorsByDepartments(departmentIds: number[], enabled: boolean) {
  const sortedKey = [...new Set(departmentIds.filter((n) => Number.isInteger(n) && n >= 1))]
    .sort((a, b) => a - b)
    .join(",")
  return useQuery({
    queryKey: addEmployeeLookupKeys.supervisorsByDepartments(sortedKey || "none"),
    queryFn: async (): Promise<AddEmployeeDepartmentSupervisorRow[]> => {
      return await fetchSupervisorsByDepartmentIds(departmentIds)
    },
    enabled: enabled && sortedKey.length > 0,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useGetUserDetailsTab(userId: string | null | undefined, method: string, enabled: boolean) {
  const id = userId?.trim() ?? ""
  return useQuery({
    queryKey: addEmployeeLookupKeys.userDetailsTab(id, method),
    queryFn: async (): Promise<Record<string, unknown>> => {
      return await fetchUserDetailsTab(id, method)
    },
    enabled: Boolean(id) && enabled,
    staleTime: method === "tab1" || method === "tab2" || method === "tab3" ? 0 : 60_000,
    refetchOnMount: method === "tab1" || method === "tab2" || method === "tab3" ? true : undefined,
    refetchOnWindowFocus: false,
  })
}

export function useGetDepartmentRolesForUser(userId: string | null | undefined, enabled: boolean) {
  const id = userId?.trim() ?? ""
  return useQuery({
    queryKey: addEmployeeLookupKeys.securityDepartmentRoles(id),
    queryFn: async (): Promise<SecurityDepartmentRolesQueryResult> => {
      return await fetchSecurityDepartmentRoles(id)
    },
    enabled: Boolean(id) && enabled,
  })
}
