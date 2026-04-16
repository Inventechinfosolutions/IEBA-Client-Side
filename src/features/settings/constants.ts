import type { SettingsModel, ReportOption, ActivityOption } from "./types"

export const DEFAULT_SETTINGS: SettingsModel = {
  version: 1,
  county: {
    logoDataUrl: null,
    countyName: "",
    welcomeMessage: "",
    isTimeRangeEnabled: false,
    startTime1: "00:00",
    startTime2: "00:00",
    endTime: "00:00",
    includedWeekends: false,
    autoApproval: false,
    supervisorApportioning: false,
    addresses: [],
  },
  general: {
    screenInactivityTimeMinutes: 120,
  },
  reports: {
    reportKey: "",
    exclusionMode: "exclude",
    selectedActivityCodes: [],
  },
  login: {
    twoFactorAuthentication: true,
    otpValidationTimerSeconds: 120,
  },
  fiscalYear: {
    fiscalYearStartMonth: "",
    fiscalYearEndMonth: "",
    year: "",
    appliedYearRanges: [],
    holidays: [],
  },
  payroll: {
    payrollBy: "Weekly",
    columns: [],
  },
}

// These are for UI/UX demonstration until real report/activity lists are fully integrated
export const REPORT_OPTIONS: ReportOption[] = Array.from({ length: 15 }, (_, i) => ({
  key: `RPT${i + 1}`,
  label: `Standard Report ${i + 1}`,
}))

export const ACTIVITY_OPTIONS: ActivityOption[] = Array.from({ length: 15 }, (_, i) => ({
  code: String(2000 + i),
  label: `Activity Code ${2000 + i}`,
}))
