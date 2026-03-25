import type { SettingsModel } from "@/features/settings/types"

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
    startTime1: "00:00",
    startTime2: "00:00",
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
    reportKey: "DSSRPT1",
    exclusionMode: "exclude",
    selectedActivityCodes: [],
  },
  login: {
    twoFactorAuthentication: true,
    otpValidationTimerSeconds: 120,
  },
}

export function getMockSettings(): SettingsModel {
  return mockSettings
}

export function setMockSettings(next: SettingsModel): void {
  mockSettings = next
}

