// ─── Dashboard Query Keys ────────────────────────────────────────────────────

export const dashboardKeys = {
  all: ["dashboard"] as const,


  personalTimeStudy: () => [...dashboardKeys.all, "personal-time-study"] as const,

  
  timeRecordRequests: () => [...dashboardKeys.all, "time-record-requests"] as const,

 
  leaveDetails: (userId: string | number) =>
    [...dashboardKeys.all, "leave-details", String(userId)] as const,

 
  staffLeave: () => [...dashboardKeys.all, "staff-leave"] as const,


  todos: () => [...dashboardKeys.all, "todos"] as const,

  
  holidays: (year: number) => [...dashboardKeys.all, "holidays", year] as const,


  userCount: () => [...dashboardKeys.all, "user-count"] as const,


  activeUsers: () => [...dashboardKeys.all, "active-users"] as const,

  
  departmentCount: () => [...dashboardKeys.all, "department-count"] as const,


  programCount: () => [...dashboardKeys.all, "program-count"] as const,


  jpCpTotals: () => [...dashboardKeys.all, "jp-cp-totals"] as const,


  reports: () => [...dashboardKeys.all, "reports"] as const,
}
