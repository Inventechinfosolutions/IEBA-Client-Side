import { useQuery } from "@tanstack/react-query"

import { apiGetUserModuleRows } from "../../api"
import { userModuleKeys } from "../../keys"
import type { GetUserModuleParams, UserModuleListResponse } from "../../types"

import {
  fetchAddEmployeeActivitiesCatalog,
  fetchAddEmployeeDepartments,
  fetchAddEmployeeJobClassifications,
  fetchAddEmployeeJobPools,
  fetchAddEmployeeTimeStudyPrograms,
  fetchDepartmentRolesCatalog,
  fetchDepartmentRolesUnassigned,
  fetchListCountyActivity,
  fetchAddEmployeeLocations,
  fetchMulticodeMasterCodes,
  fetchSupervisorsByDepartmentIds,
  fetchUserProgramsAndActivities,
} from "../api"
import { addEmployeeLookupKeys, departmentRolesUnassignedCacheUserKey } from "../keys"
import type {
  AddEmployeeActivityCatalogRow,
  AddEmployeeCountyActivityRow,
  AddEmployeeDepartmentOption,
  AddEmployeeJobClassificationRow,
  AddEmployeeJobPoolRow,
  AddEmployeeLocationRow,
  AddEmployeeMasterCodeRow,
  AddEmployeeSecurityRoleCatalogItem,
  AddEmployeeDepartmentSupervisorRow,
  AddEmployeeTimeStudyProgramRow,
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
 * Security tab only (panel mounts when that tab is active): GET /departments/user/roles-unassigned.
 * Add: `allowFetchWithoutUserId` true → omit `userId` until draft id exists.
 * Edit: requires non-empty `userId` (always sent as query param).
 */
export function useGetDepartmentRolesUnassigned(
  userId: string | null | undefined,
  allowFetchWithoutUserId: boolean,
) {
  const id = userId?.trim() ?? ""
  const key = departmentRolesUnassignedCacheUserKey(userId, allowFetchWithoutUserId)
  const enabled = Boolean(id) || allowFetchWithoutUserId
  return useQuery({
    queryKey: addEmployeeLookupKeys.departmentRolesUnassignedAdd(key),
    queryFn: async (): Promise<AddEmployeeSecurityRoleCatalogItem[]> => {
      return await fetchDepartmentRolesUnassigned(id ? { userId: id } : undefined)
    },
    enabled,
    retry: 1,
    /** Keep first successful GET; assign/unassign updates UI via form state + optional cache merge (no refetch). */
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}

export function useGetAddEmployeeTimeStudyPrograms(enabled = true) {
  return useQuery({
    queryKey: addEmployeeLookupKeys.timeStudyProgramsAssignments(),
    queryFn: async (): Promise<AddEmployeeTimeStudyProgramRow[]> => {
      return await fetchAddEmployeeTimeStudyPrograms()
    },
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}

/**
 * Edit mode Time Study tab: GET /timestudyprograms/user/programs-activities?userId= (profile id).
 */
export function useGetUserProgramsAndActivities(
  userId: string | null | undefined,
  enabled: boolean,
) {
  const id = userId?.trim() ?? ""
  const key = id || "__none__"
  return useQuery({
    queryKey: addEmployeeLookupKeys.userProgramsActivities(key),
    queryFn: async (): Promise<UserProgramsActivitiesDepartmentBundle[]> => {
      return await fetchUserProgramsAndActivities(id)
    },
    enabled: Boolean(id) && enabled,
    staleTime: 30_000,
    retry: 1,
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
