import { api } from "@/lib/api"
import type { SettingsModel } from "../types"

/** Fetches the general application settings from the backend. */
export async function getGeneralSettings(): Promise<Partial<SettingsModel>> {
  try {
    const res = await api.get<any>("/setting")
    const data = res.data ?? {}

    // Map the generic KV pairs from the backend to our structured model
    // Note: This logic will expand as more keys are finalized in the DB
    return {
      login: {
        twoFactorAuthentication: data.TWO_FA_ENABLED === "true",
        otpValidationTimerSeconds: Number(data.OTP_TIMER ?? 120),
      },
      general: {
        screenInactivityTimeMinutes: Number(data.INACTIVITY_TIMEOUT ?? 120),
      },
    }
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return {}
  }
}

/** Updates a specific setting. */
export async function updateAppSetting(key: string, value: any): Promise<void> {
  await api.put(`/setting/${key}`, { value: String(value) })
}
