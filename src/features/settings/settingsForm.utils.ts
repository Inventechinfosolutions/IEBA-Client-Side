import type { FieldErrors } from "react-hook-form"

import { PAYROLL_COLUMN_DEFS } from "@/features/settings/components/Payroll/types"
import type { SettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import { SETTINGS_FORM_SAVE_SECTION_ORDER } from "@/features/settings/settingsForm.constants"
import type {
  SettingsFormDerivedFiscalYear,
  SettingsFormValues,
  SettingsModel,
} from "@/features/settings/types"

const DEFAULT_SECTION_ERROR = "Please fix the errors in this section before saving."

function walkFieldErrorTree(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null
  const node = obj as Record<string, unknown>
  if (typeof node.message === "string" && node.message.trim()) return node.message
  for (const key of Object.keys(node)) {
    const found = walkFieldErrorTree(node[key])
    if (found) return found
  }
  return null
}

export function resolveSettingsFormSectionErrorMessage(
  errors: FieldErrors<SettingsFormValues>,
  section: SettingsFormSaveSection,
): string {
  const sectionErrors = (errors as Record<string, unknown>)[section]
  if (!sectionErrors) return DEFAULT_SECTION_ERROR
  return walkFieldErrorTree(sectionErrors) ?? DEFAULT_SECTION_ERROR
}

export function resolveFirstSettingsFormErrorMessage(
  errors: FieldErrors<SettingsFormValues>,
): string {
  const errRecord = errors as Record<string, unknown>
  for (const section of SETTINGS_FORM_SAVE_SECTION_ORDER) {
    const sectionErrors = errRecord[section]
    if (!sectionErrors) continue
    return walkFieldErrorTree(sectionErrors) ?? DEFAULT_SECTION_ERROR
  }
  return "Please fix the errors before saving."
}

export function buildSettingsFormValues(
  settings: SettingsModel,
  derivedFiscalYear: SettingsFormDerivedFiscalYear,
): SettingsFormValues {
  const addresses =
    settings.county.addresses && settings.county.addresses.length > 0
      ? settings.county.addresses
      : [{ locationId: undefined, location: "", street: "", city: "", state: "", zip: "" }]

  return {
    county: {
      logoDataUrl: settings.county.logoDataUrl ?? null,
      countyName: settings.county.countyName,
      welcomeMessage: settings.county.welcomeMessage ?? "",
      isTimeRangeEnabled: settings.county.isTimeRangeEnabled ?? false,
      startTime1: settings.county.startTime1 || "00:00",
      startTime2: settings.county.startTime2 || "00:00",
      endTime: settings.county.endTime || "00:00",
      includedWeekends: settings.county.includedWeekends,
      autoApproval: settings.county.autoApproval,
      supervisorApportioning: settings.county.supervisorApportioning,
      addresses,
    },
    general: {
      screenInactivityTimeMinutes: settings.general?.screenInactivityTimeMinutes ?? 120,
    },
    reports: {
      reportKey: settings.reports?.reportKey ?? "",
      exclusionMode: settings.reports?.exclusionMode ?? "exclude",
      selectedActivityCodes: settings.reports?.selectedActivityCodes ?? [],
    },
    login: {
      twoFactorAuthentication: settings.login?.twoFactorAuthentication ?? false,
      otpValidationTimerSeconds: settings.login?.otpValidationTimerSeconds ?? 120,
    },
    fiscalYear: derivedFiscalYear,
    payroll: {
      payrollBy: settings.payroll?.payrollBy ?? "Weekly",
      columns:
        settings.payroll?.columns && settings.payroll.columns.length > 0
          ? settings.payroll.columns
          : PAYROLL_COLUMN_DEFS.map((d) => ({
              key: d.key,
              label: d.label,
              enabled: true,
              editable: false,
            })),
    },
  }
}
