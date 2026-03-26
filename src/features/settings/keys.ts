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
    activities: () => [...settingsKeys.reports.all(), "activities"] as const,
    detail: () => [...settingsKeys.reports.all(), "detail"] as const,
  },

  autoGenerateCode: {
    all: () => [...settingsKeys.all, "auto-generate-code"] as const,
    detail: () => [...settingsKeys.autoGenerateCode.all(), "detail"] as const,
  },

  payroll: {
    all: () => [...settingsKeys.all, "payroll"] as const,
    detail: () => [...settingsKeys.payroll.all(), "detail"] as const,
  },

  fiscalYear: {
    all: () => [...settingsKeys.all, "fiscal-year"] as const,
    detail: () => [...settingsKeys.fiscalYear.all(), "detail"] as const,
  },
} as const

