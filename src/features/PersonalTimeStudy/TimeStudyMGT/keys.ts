export const timeStudyMGTKeys = {
  all: ["timeStudyMGT"] as const,

  /** Employee list (with optional search and department filters) */
  employeeList: (search?: string, departmentId?: string) =>
    [...timeStudyMGTKeys.all, "employees", search ?? "", departmentId ?? ""] as const,

  /** Month legend for a specific user + month + year */
  monthLegend: (userId: string, month: number, year: number) =>
    [...timeStudyMGTKeys.all, "monthLegend", userId, month, year] as const,

  /** Minute summary for a specific user + month + year */
  minutesSummary: (userId: string, month: number, year: number) =>
    [...timeStudyMGTKeys.all, "minutesSummary", userId, month, year] as const,

  /** Day detail for a specific user + date */
  dayDetail: (userId: string, date: string) =>
    [...timeStudyMGTKeys.all, "dayDetail", userId, date] as const,

  /** Dropdowns for a specific user */
  dropdowns: (userId: string) =>
    [...timeStudyMGTKeys.all, "dropdowns", userId] as const,
}
