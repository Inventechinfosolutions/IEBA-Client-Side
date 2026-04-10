import { z } from "zod"

import { SettingsFormSaveSection, isSettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import { settingsFormSchema } from "@/features/settings/schemas"

export { SettingsFormSaveSection, isSettingsFormSaveSection }
import type { CountySettingsModel } from "@/features/settings/components/Country/types"
import type { LoginSettingsModel } from "@/features/settings/components/Login/types"
import type { GeneralSettingsModel } from "@/features/settings/components/General/types"
import type { ReportsSettingsModel } from "@/features/settings/components/Reports/types"
import type { FiscalYearSettingsModel } from "@/features/settings/components/FiscalYear/types"
import type { PayrollSettingsModel } from "@/features/settings/components/Payroll/types"

export type SettingsSection =
  | "County"
  | "Auto Generate Code"
  | "Payroll"
  | "Fiscal Year"
  | "Reports"
  | "General"
  | "Login"

export const SETTINGS_ACCORDION_SECTIONS = [
  "County",
  "Auto Generate Code",
  "Payroll",
  "Fiscal Year",
  "Reports",
  "General",
  "Login",
] as const satisfies readonly SettingsSection[]

export type SettingsModel = {
  version: number
  county: CountySettingsModel
  general: GeneralSettingsModel
  reports: ReportsSettingsModel
  login: LoginSettingsModel
  fiscalYear: FiscalYearSettingsModel
  payroll: PayrollSettingsModel
}

export type SettingsFormValues = z.input<typeof settingsFormSchema>

export type SettingsResponse = SettingsModel

export type UpdateSettingsInput = {
  values: SettingsFormValues
  submitterSection?: SettingsFormSaveSection
}

export type SettingsFormDerivedFiscalYear = {
  fiscalYearStartMonth: string
  fiscalYearEndMonth: string
  year: string
  appliedYearRanges: string[]
  holidays: SettingsFormValues["fiscalYear"]["holidays"]
}

export type SettingsFormInnerProps = {
  settings: SettingsModel
  isSaving: boolean
  onSubmitSettings: (
    values: SettingsFormValues,
    meta?: { submitterSection?: SettingsFormSaveSection },
  ) => void
}

