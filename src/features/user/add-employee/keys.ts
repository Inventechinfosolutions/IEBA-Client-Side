export const addEmployeeLookupKeys = {
  all: ["add-employee-lookups"] as const,
  jobClassifications: () => [...addEmployeeLookupKeys.all, "job-classifications"] as const,
  jobPools: () => [...addEmployeeLookupKeys.all, "job-pools"] as const,
  activitiesCatalog: () => [...addEmployeeLookupKeys.all, "activities-catalog"] as const,
  departments: () => [...addEmployeeLookupKeys.all, "departments"] as const,
  departmentRolesCatalog: () => [...addEmployeeLookupKeys.all, "department-roles-catalog"] as const,
  timeStudyProgramsAssignments: () =>
    [...addEmployeeLookupKeys.all, "time-study-programs-assignments"] as const,
  /** Master codes with allowMulticode (GET /master-codes, filtered client-side). */
  multicodeMasterCodes: () => [...addEmployeeLookupKeys.all, "multicode-master-codes"] as const,
  /** GET /activity-codes (active activity codes; county-activity equivalent). */
  countyActivityList: () => [...addEmployeeLookupKeys.all, "county-activity-list"] as const,
}
