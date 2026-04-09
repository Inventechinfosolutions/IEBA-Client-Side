/** Sections that submit independently via `data-settings-section` on save buttons. */
export const SettingsFormSaveSection = {
  County: "county",
  Reports: "reports",
  Login: "login",
  General: "general",
  Payroll: "payroll",
  FiscalYear: "fiscalYear",
} as const

export type SettingsFormSaveSection =
  (typeof SettingsFormSaveSection)[keyof typeof SettingsFormSaveSection]

const SAVE_SECTION_SET = new Set<string>(Object.values(SettingsFormSaveSection))

export function isSettingsFormSaveSection(
  value: string | undefined | null,
): value is SettingsFormSaveSection {
  return value != null && SAVE_SECTION_SET.has(value)
}
