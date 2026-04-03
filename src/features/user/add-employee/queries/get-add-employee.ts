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
  fetchListCountyActivity,
  fetchMulticodeMasterCodes,
} from "../api"
import { addEmployeeLookupKeys } from "../keys"
import type {
  AddEmployeeActivityCatalogRow,
  AddEmployeeCountyActivityRow,
  AddEmployeeDepartmentOption,
  AddEmployeeJobClassificationRow,
  AddEmployeeJobPoolRow,
  AddEmployeeMasterCodeRow,
  AddEmployeeSecurityRoleCatalogItem,
  AddEmployeeTimeStudyProgramRow,
} from "../types"

export function useGetEmployees(params: GetUserModuleParams) {
  return useQuery({
    queryKey: userModuleKeys.list(params),
    queryFn: (): Promise<UserModuleListResponse> => apiGetUserModuleRows(params),
  })
}

export function useGetAddEmployeeJobClassifications() {
  return useQuery({
    queryKey: addEmployeeLookupKeys.jobClassifications(),
    queryFn: async (): Promise<AddEmployeeJobClassificationRow[]> => {
      return await fetchAddEmployeeJobClassifications()
    },
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

export function useGetAddEmployeeActivitiesCatalog() {
  return useQuery({
    queryKey: addEmployeeLookupKeys.activitiesCatalog(),
    queryFn: async (): Promise<AddEmployeeActivityCatalogRow[]> => {
      return await fetchAddEmployeeActivitiesCatalog()
    },
  })
}

export function useGetAddEmployeeDepartments() {
  return useQuery({
    queryKey: addEmployeeLookupKeys.departments(),
    queryFn: async (): Promise<AddEmployeeDepartmentOption[]> => {
      return await fetchAddEmployeeDepartments()
    },
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

export function useGetAddEmployeeTimeStudyPrograms() {
  return useQuery({
    queryKey: addEmployeeLookupKeys.timeStudyProgramsAssignments(),
    queryFn: async (): Promise<AddEmployeeTimeStudyProgramRow[]> => {
      return await fetchAddEmployeeTimeStudyPrograms()
    },
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
