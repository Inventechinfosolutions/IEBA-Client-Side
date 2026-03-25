import { z } from "zod"

import { settingsFormSchema } from "@/features/settings/schemas"

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
}

export type SettingsFormValues = z.input<typeof settingsFormSchema>

export type SettingsResponse = SettingsModel

export type UpdateSettingsInput = {
  values: SettingsFormValues
}

