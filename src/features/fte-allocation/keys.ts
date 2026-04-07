export const fteAllocationKeys = {
  all: ["fteAllocation"] as const,

  fiscalYears: () => [...fteAllocationKeys.all, "fiscalYears"] as const,

  employees: (params?: { fiscalYearId?: string; includeInactive?: boolean }) =>
    [
      ...fteAllocationKeys.all,
      "employees",
      params?.fiscalYearId,
      params?.includeInactive ?? false,
    ] as const,

  programs: (fiscalYearId?: string, employeeId?: string) =>
    [
      ...fteAllocationKeys.all,
      "programs",
      fiscalYearId,
      employeeId,
    ] as const,
}
