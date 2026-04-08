export const addEmployeeLookupKeys = {
  all: ["add-employee-lookups"] as const,
  jobClassifications: () => [...addEmployeeLookupKeys.all, "job-classifications"] as const,
  /** GET /location (Employee/Login Details tab only — query enabled when that panel mounts). */
  locations: () => [...addEmployeeLookupKeys.all, "locations"] as const,
  jobPools: () => [...addEmployeeLookupKeys.all, "job-pools"] as const,
  activitiesCatalog: () => [...addEmployeeLookupKeys.all, "activities-catalog"] as const,
  departments: () => [...addEmployeeLookupKeys.all, "departments"] as const,
  departmentRolesCatalog: () => [...addEmployeeLookupKeys.all, "department-roles-catalog"] as const,
  timeStudyProgramsAssignments: () =>
    [...addEmployeeLookupKeys.all, "time-study-programs-assignments"] as const,
  /** GET /timestudyprograms/user/programs-activities?userId= — edit mode Time Study tab. */
  userProgramsActivities: (userKey: string) =>
    [...addEmployeeLookupKeys.all, "user-programs-activities", userKey] as const,
  /** Master codes with allowMulticode (GET /master-codes, filtered client-side). */
  multicodeMasterCodes: () => [...addEmployeeLookupKeys.all, "multicode-master-codes"] as const,
  /** GET /activity-codes (active activity codes; county-activity equivalent). */
  countyActivityList: () => [...addEmployeeLookupKeys.all, "county-activity-list"] as const,
  /** GET /activity-departments?departmentId= — Time Study tab activity transfer (ActivityDepartment ids). */
  activityDepartmentsByDepartment: (departmentIdKey: string) =>
    [...addEmployeeLookupKeys.all, "activity-departments-by-department", departmentIdKey] as const,
  /**
   * GET /departments/user/roles-unassigned — Security tab (add + edit).
   * `userKey` is `__none__` when add flow omits userId, else trimmed user id.
   */
  departmentRolesUnassignedAdd: (userKey: string) =>
    [...addEmployeeLookupKeys.all, "department-roles-unassigned-add", userKey] as const,
  /** GET /users/supervisors — sorted department id key for stable cache. */
  supervisorsByDepartments: (departmentIdsKey: string) =>
    [...addEmployeeLookupKeys.all, "supervisors-by-departments", departmentIdsKey] as const,
}

/** Segment for `departmentRolesUnassignedAdd` — must match `useGetDepartmentRolesUnassigned`. */
export function departmentRolesUnassignedCacheUserKey(
  userId: string | null | undefined,
  allowFetchWithoutUserId: boolean,
): string {
  const id = userId?.trim() ?? ""
  return id || (allowFetchWithoutUserId ? "__none__" : "__no-user__")
}
