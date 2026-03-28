export const fteAllocationKeys = {
  all: ["fteAllocation"] as const,

  fiscalYears: () => [...fteAllocationKeys.all, "fiscalYears"] as const,

  employees: (fiscalYearId?: string) =>
    [...fteAllocationKeys.all, "employees", fiscalYearId] as const,

  programs: (fiscalYearId?: string, employeeId?: string) =>
    [
      ...fteAllocationKeys.all,
      "programs",
      fiscalYearId,
      employeeId,
    ] as const,
}
