import { SettingsFormSaveSection } from "@/features/settings/enums/setting.enum"

type SaveSection = (typeof SettingsFormSaveSection)[keyof typeof SettingsFormSaveSection]

export const SETTINGS_FORM_SECTION_SUCCESS_MESSAGES: Record<SaveSection, string> = {
  [SettingsFormSaveSection.County]: "County settings updated successfully",
  [SettingsFormSaveSection.Reports]: "Reports updated successfully",
  [SettingsFormSaveSection.Login]: "Login settings updated successfully",
  [SettingsFormSaveSection.General]: "General settings updated successfully",
  [SettingsFormSaveSection.Payroll]: "Payroll updated successfully",
  [SettingsFormSaveSection.FiscalYear]: "Fiscal Year updated successfully",
}

export const SETTINGS_FORM_SAVE_SECTION_ORDER: SaveSection[] = [
  SettingsFormSaveSection.County,
  SettingsFormSaveSection.Reports,
  SettingsFormSaveSection.Login,
  SettingsFormSaveSection.General,
  SettingsFormSaveSection.Payroll,
  SettingsFormSaveSection.FiscalYear,
]
