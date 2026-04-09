/** Use with `invalidateQueries({ predicate })` so GET-by-id is not refetched. */
export function matchPayPeriodListQueries(query: { queryKey: readonly unknown[] }): boolean {
  const k = query.queryKey
  return (
    k.length >= 3 &&
    k[0] === "scheduleTimeStudy" &&
    k[1] === "payPeriods" &&
    k[2] !== "byId"
  )
}

export const scheduleTimeStudyKeys = {
  all: ["scheduleTimeStudy"] as const,
  holidayList: (startmonth: string, endmonth: string) =>
    [...scheduleTimeStudyKeys.all, "holidayList", startmonth, endmonth] as const,
  fiscalYears: () => [...scheduleTimeStudyKeys.all, "fiscalYears"] as const,
  payPeriods: () => [...scheduleTimeStudyKeys.all, "payPeriods"] as const,
  payPeriodList: (filters: { departmentId: number; fiscalyear: string }) =>
    [...scheduleTimeStudyKeys.payPeriods(), filters] as const,
  payPeriodById: (id: number) => [...scheduleTimeStudyKeys.payPeriods(), "byId", id] as const,
  departmentUsers: () => [...scheduleTimeStudyKeys.all, "departmentUsers"] as const,
  departmentUsersList: (filters: { departmentId: number }) =>
    [...scheduleTimeStudyKeys.departmentUsers(), filters] as const,
  jobPools: () => [...scheduleTimeStudyKeys.all, "jobPools"] as const,
  jobPoolsByDepartment: (filters: { departmentId: number }) =>
    [...scheduleTimeStudyKeys.jobPools(), filters] as const,
  groups: () => [...scheduleTimeStudyKeys.all, "groups"] as const,
  groupList: (filters: { departmentId: number; fiscalyear: string }) =>
    [...scheduleTimeStudyKeys.groups(), filters] as const,
  groupById: (id: number) => [...scheduleTimeStudyKeys.groups(), "byId", id] as const,
  ppGroupList: () => [...scheduleTimeStudyKeys.all, "ppGroupList"] as const,
  ppGroupListEnriched: (filters: { departmentId: number; fiscalyear: string }) =>
    [...scheduleTimeStudyKeys.ppGroupList(), filters] as const,
  departments: () => [...scheduleTimeStudyKeys.all, "departments"] as const,
}
