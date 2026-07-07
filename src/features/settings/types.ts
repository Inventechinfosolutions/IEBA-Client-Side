import { z } from "zod"

import { SettingsFormSaveSection, isSettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import { settingsFormSchema } from "@/features/settings/schemas"

export { SettingsFormSaveSection, isSettingsFormSaveSection }
import type { CountySettingsModel } from "@/features/settings/components/Country/types"
import type { LoginSettingsModel } from "@/features/settings/components/Login/types"
import type { GeneralSettingsModel } from "@/features/settings/components/General/types"
import type { ReportsSettingsModel } from "@/features/settings/components/Reports/types"
import type { FiscalYearSettingsModel } from "@/features/settings/components/FiscalYear/types"
import type { PayrollSettingsModel } from "./payroll"
import type { MasterCodeSettingsModel } from "@/features/settings/components/MasterCode/types"

import type { ReportMasterCodeData } from "@/features/reports/lib/reportMasterCodeData.utils"

export type ReportOption = {
  key: string
  label: string
  id?: number
  criteria?: string | null
  type?: string
  reportdata?: string | null
  filename?: string | null
  path?: string | null
  status?: string | null
  excludedMasterCodeData?: ReportMasterCodeData
  includedMasterCodeData?: ReportMasterCodeData
}
export type ActivityOption = { code: string; label: string }

export type SettingsSection =
  | "County"
  | "Auto Generate Code"
  | "Payroll"
  | "Fiscal Year"
  | "Reports"
  | "General"
  | "Login"
  | "Master Code"

export const SETTINGS_ACCORDION_SECTIONS = [
  "County",
  "Auto Generate Code",
  "Payroll",
  "Fiscal Year",
  "Reports",
  "General",
  "Login",
  "Master Code",
] as const satisfies readonly SettingsSection[]

export type SettingsModel = {
  version: number
  county: CountySettingsModel
  general: GeneralSettingsModel
  reports: ReportsSettingsModel
  login: LoginSettingsModel
  fiscalYear: FiscalYearSettingsModel
  payroll: PayrollSettingsModel
  masterCode: MasterCodeSettingsModel
}

export type SettingsFormValues = z.input<typeof settingsFormSchema>

export type SettingsResponse = SettingsModel

export type ReportsSaveScope = "masterCodes" | "activities"

export type ReportsBucketMode = "include" | "exclude"

export type UpdateSettingsInput = {
  values: SettingsFormValues
  submitterSection?: SettingsFormSaveSection
  /** Which Reports row Save was clicked (master codes vs activities). */
  reportsSaveScope?: ReportsSaveScope
  /** Bucket API mode to refetch after save (assign → include, unassign activity → exclude). */
  reportsBucketMode?: ReportsBucketMode
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
    meta?: {
      submitterSection?: SettingsFormSaveSection
      reportsSaveScope?: ReportsSaveScope
      reportsBucketMode?: ReportsBucketMode
    },
  ) => void
}

