import type { SettingsModel } from "@/features/settings/types"

export type ReportOption = { key: string; label: string }
export type ActivityOption = { code: string; label: string }

export const MOCK_NETWORK_DELAY_MS = 450

export async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

let mockSettings: SettingsModel = {
  version: 1,
  county: {
    logoDataUrl: null,
    countyName: "Amador",
    welcomeMessage: "Welcome to Amador",
    isTimeRangeEnabled: false,
    startTime1: "00:00",
    startTime2: "01:00",
    endTime: "00:00",
    includedWeekends: false,
    autoApproval: false,
    supervisorApportioning: false,
    addresses: [
      {
        location: "Main",
        street: "10877 Conductor Blvd; Suit",
        city: "Sutter Creek",
        state: "CA",
        zip: "95685",
      },
    ],
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
    columns: [
      { key: "payPeriodBegin", label: "Pay Period Begin", enabled: true, editable: false },
      { key: "department", label: "Department", enabled: true, editable: false },
      { key: "employeeMiddleName", label: "Employee Middle Name", enabled: true, editable: false },
      { key: "employeeLastName", label: "Employee Last Name", enabled: true, editable: false },
      { key: "bargainingUnit", label: "Bargaining Unit", enabled: true, editable: false },
      { key: "type", label: "Type", enabled: true, editable: false },
      { key: "position", label: "Position", enabled: true, editable: false },
      { key: "suffix", label: "Suffix", enabled: true, editable: false },
      { key: "payPeriodEnd", label: "Pay Period End", enabled: true, editable: false },
      { key: "checkDate", label: "Check Date", enabled: true, editable: false },
      { key: "fica", label: "FICA", enabled: true, editable: false },
      { key: "pers", label: "PERS", enabled: true, editable: false },
    ],
  },
}

export function getMockSettings(): SettingsModel {
  return mockSettings
}

export function setMockSettings(next: SettingsModel): void {
  mockSettings = next
}

export const mockReportOptions: ReportOption[] = Array.from({ length: 20 }, (_, i) => {
  const n = i + 1
  const key = `DSSRPT${n}`
  const label =
    n === 1
      ? "DSSRPT1 Employee Individual Time Study Summary"
      : n === 2
        ? "DSSRPT2 Time Study Hours by Employee"
        : n === 3
          ? "DSSRPT3 Time Study Summary"
          : n === 4
            ? "DSSRPT4 Time Study Summary by Program"
            : n === 5
              ? "DSSRPT5 Salary & Benefits by Employee"
              : `${key} Report ${n}`
  return { key, label }
})

export const mockActivityOptions: ActivityOption[] = Array.from({ length: 20 }, (_, i) => {
  const code = String(1000 + i).padStart(5, "0")
  return { code, label: `Activity ${i + 1}` }
})

