export const personalTimeStudyKeys = {
  all: ["personalTimeStudy"] as const,
  /** Placeholder master-code list — disabled until API exists. */
  masterCodes: () => [...personalTimeStudyKeys.all, "masterCodes"] as const,
  lists: () => [...personalTimeStudyKeys.all, "list"] as const,
  list: (filters?: { search?: string }) =>
    [...personalTimeStudyKeys.lists(), filters] as const,
  /** Month legend for a specific user + month + year */
  monthLegend: (userId: string, month: number, year: number) =>
    [...personalTimeStudyKeys.all, "month", userId, month, year] as const,

  /** Day detail for a specific user + date string */
  dayDetail: (userId: string, dateStr: string) =>
    [...personalTimeStudyKeys.all, "day", userId, dateStr] as const,

  /** User programs and activities dropdowns */
  dropdowns: (userId: string) =>
    [...personalTimeStudyKeys.all, "dropdowns", userId] as const,

  /** User programs and activities for multicode (MAA) sub-rows */
  dropdownsMulticode: (userId: string) =>
    [...personalTimeStudyKeys.all, "dropdowns-multicode", userId] as const,

  /** Placeholder — align with future `GET .../:id` for edit flows. */
  detail: (id: string) =>
    [...personalTimeStudyKeys.all, "detail", id] as const,
  /** Time entry summary (minutes, balances) for a specific user + date */
  timeEntrySummary: (userId: string, dateStr: string) =>
    [...personalTimeStudyKeys.all, "timeentry-summary", userId, dateStr] as const,
}
