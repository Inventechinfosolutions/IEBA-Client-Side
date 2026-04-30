export const timeStudyMGTKeys = {
  all: ["timeStudyMGT"] as const,

  /** Employee list (with optional search filter) */
  employeeList: (search?: string) =>
    [...timeStudyMGTKeys.all, "employees", search ?? ""] as const,

  /** Month legend for a specific user + month + year */
  monthLegend: (userId: string, month: number, year: number) =>
    [...timeStudyMGTKeys.all, "monthLegend", userId, month, year] as const,

  /** Minute summary for a specific user + month + year */
  minutesSummary: (userId: string, month: number, year: number) =>
    [...timeStudyMGTKeys.all, "minutesSummary", userId, month, year] as const,
}
