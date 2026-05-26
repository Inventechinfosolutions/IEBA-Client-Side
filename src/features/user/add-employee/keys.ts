export const addEmployeeLookupKeys = {
  all: ["add-employee-lookups"] as const,
  jobClassifications: () => [...addEmployeeLookupKeys.all, "job-classifications"] as const,
  /** GET /location (Employee/Login Details tab only — query enabled when that panel mounts). */
  locations: () => [...addEmployeeLookupKeys.all, "locations"] as const,
  jobPools: () => [...addEmployeeLookupKeys.all, "job-pools"] as const,
  activitiesCatalog: () => [...addEmployeeLookupKeys.all, "activities-catalog"] as const,
  departments: () => [...addEmployeeLookupKeys.all, "departments"] as const,
  departmentRolesCatalog: () => [...addEmployeeLookupKeys.all, "department-roles-catalog"] as const,
  /**
   * Time Study: merged programs + activities per department (`__scope__` or department id).
   */
  userProgramsActivities: (userKey: string, departmentKey = "__scope__") =>
    [...addEmployeeLookupKeys.all, "user-programs-activities", userKey, departmentKey] as const,
  /** GET …/user/departments — departments mapped to user. */
  userDepartments: (userKey: string, scope = "timestudy") =>
    [...addEmployeeLookupKeys.all, "user-departments", userKey, scope] as const,
  /** GET …/user/programs-with-assignments — department scope list (lighter). */
  userProgramsWithAssignments: (userKey: string, departmentKey = "__scope__") =>
    [...addEmployeeLookupKeys.all, "user-programs-with-assignments", userKey, departmentKey] as const,
  /** GET …/user/activities-with-assignments */
  userActivitiesWithAssignments: (userKey: string, departmentKey = "__scope__") =>
    [...addEmployeeLookupKeys.all, "user-activities-with-assignments", userKey, departmentKey] as const,
  /** Master codes with allowMulticode (GET /master-codes, filtered client-side). */
  multicodeMasterCodes: () => [...addEmployeeLookupKeys.all, "multicode-master-codes"] as const,
  /** GET /activity-codes (active activity codes; county-activity equivalent). */
  countyActivityList: () => [...addEmployeeLookupKeys.all, "county-activity-list"] as const,
  /** GET /activity-departments?departmentId= — Time Study tab activity transfer (ActivityDepartment ids). */
  activityDepartmentsByDepartment: (departmentIdKey: string) =>
    [...addEmployeeLookupKeys.all, "activity-departments-by-department", departmentIdKey] as const,
  /**
   * GET /departments/assignedDepartment/roles — Security tab (requires userId).
   */
  securityDepartmentRoles: (userId: string) =>
    [...addEmployeeLookupKeys.all, "security-department-roles", userId] as const,
  /** GET /users/:id/details/required?method=tab1|tab2|tab3 */
  userDetailsTab: (userId: string, method: string) =>
    [...addEmployeeLookupKeys.all, "user-details-tab", userId, method] as const,
  /**
   * @deprecated Use securityDepartmentRoles. Kept for cache invalidation compatibility during migration.
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
