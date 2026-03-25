import { z } from "zod"

import { settingsFormSchema } from "@/features/settings/schemas"
import type { LoginSettingsModel } from "@/features/settings/components/Login/types"
import type { GeneralSettingsModel } from "@/features/settings/components/General/types"
import type { ReportsSettingsModel } from "@/features/settings/components/Reports/types"

export type SettingsSection =
  | "County"
  | "Auto Generate Code"
  | "Payroll"
  | "Fiscal Year"
  | "Reports"
  | "General"
  | "Login"

export type CountyAddressRow = {
  location: string
  street: string
  city: string
  state: string
  zip: string
}

export type SettingsModel = {
  version: number
  county: {
    logoDataUrl: string | null
    countyName: string
    welcomeMessage: string
    startTime1: string
    startTime2: string
    endTime: string
    includedWeekends: boolean
    autoApproval: boolean
    supervisorApportioning: boolean
    addresses: CountyAddressRow[]
  }
  general: GeneralSettingsModel
  reports: ReportsSettingsModel
  login: LoginSettingsModel
}

export type SettingsFormValues = z.input<typeof settingsFormSchema>

export type SettingsResponse = SettingsModel

export type UpdateSettingsInput = {
  values: SettingsFormValues
}

