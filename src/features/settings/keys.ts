export const settingsKeys = {
  all: ["settings"] as const,
  detail: () => [...settingsKeys.all, "detail"] as const,

  county: {
    all: () => [...settingsKeys.all, "county"] as const,
    detail: () => [...settingsKeys.county.all(), "detail"] as const,
  },

  general: {
    all: () => [...settingsKeys.all, "general"] as const,
    detail: () => [...settingsKeys.general.all(), "detail"] as const,
  },

  login: {
    all: () => [...settingsKeys.all, "login"] as const,
    detail: () => [...settingsKeys.login.all(), "detail"] as const,
  },

  reports: {
    all: () => [...settingsKeys.all, "reports"] as const,
    lists: () => [...settingsKeys.reports.all(), "list"] as const,
    list: () => [...settingsKeys.reports.lists()] as const,
    byDepartment: (departmentId: string) =>
      [...settingsKeys.reports.all(), "by-department", departmentId] as const,
    masterCodes: () => [...settingsKeys.reports.all(), "master-codes", "all"] as const,
    masterCodeBuckets: (selectedIdsKey: string, mode: string) =>
      [...settingsKeys.reports.all(), "master-code-buckets", selectedIdsKey, mode] as const,
    activities: () => [...settingsKeys.reports.all(), "activities"] as const,
    activityBuckets: (idsKey: string, selectedCodesKey: string, mode: string) =>
      [
        ...settingsKeys.reports.all(),
        "activity-buckets",
        idsKey,
        selectedCodesKey,
        mode,
      ] as const,
    transferFlags: (
      masterCodeMode: string,
      selectedIdsKey: string,
      activityMode: string,
      selectedCodesKey: string,
      excludedCodesKey: string,
    ) =>
      [
        ...settingsKeys.reports.all(),
        "transfer-flags",
        masterCodeMode,
        selectedIdsKey,
        activityMode,
        selectedCodesKey,
        excludedCodesKey,
      ] as const,
    detail: () => [...settingsKeys.reports.all(), "detail"] as const,
  },

  autoGenerateCode: {
    all: () => [...settingsKeys.all, "auto-generate-code"] as const,
    detail: () => [...settingsKeys.autoGenerateCode.all(), "detail"] as const,
  },

  masterCode: {
    all: () => [...settingsKeys.all, "master-code"] as const,
    list: (clientId: number) => [...settingsKeys.masterCode.all(), "list", clientId] as const,
  },

  payroll: {
    all: () => [...settingsKeys.all, "payroll"] as const,
    detail: () => [...settingsKeys.payroll.all(), "detail"] as const,
  },

  fiscalYear: {
    all: () => [...settingsKeys.all, "fiscal-year"] as const,
    detail: () => [...settingsKeys.fiscalYear.all(), "detail"] as const,
    list: () => [...settingsKeys.fiscalYear.all(), "list"] as const,
    holidaysByRange: (startMonthMmDdYyyy: string, endMonthMmDdYyyy: string) =>
      [...settingsKeys.fiscalYear.all(), "holidays", startMonthMmDdYyyy, endMonthMmDdYyyy] as const,
  },
} as const
