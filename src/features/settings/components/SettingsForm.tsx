import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo } from "react"
import { FormProvider, useForm, type FieldErrors } from "react-hook-form"
import { toast } from "sonner"
import { Check, X } from "lucide-react"

import { PAYROLL_COLUMN_DEFS } from "@/features/settings/components/Payroll/types"
import { settingsFormSchema } from "@/features/settings/schemas"
import { useSettingsModule } from "@/features/settings/hooks/useSettingsModule"
import type {
  SettingsFormInnerProps,
  SettingsFormSaveSection,
  SettingsFormValues,
} from "@/features/settings/types"
import { SettingsAccordion } from "@/features/settings/components/SettingsAccordion"

const SECTION_SUCCESS_MESSAGES: Record<SettingsFormSaveSection, string> = {
  county: "County settings updated successfully",
  reports: "Reports updated successfully",
  login: "Login settings updated successfully",
  general: "General settings updated successfully",
  payroll: "Payroll updated successfully",
  fiscalYear: "Fiscal Year updated successfully",
}

const VALID_SECTIONS: SettingsFormSaveSection[] = [
  "county",
  "reports",
  "login",
  "general",
  "payroll",
  "fiscalYear",
]

function resolveSectionErrorMessage(
  errors: FieldErrors<SettingsFormValues>,
  section: SettingsFormSaveSection,
): string {
  const sectionErrors = (errors as Record<string, unknown>)[section]
  if (!sectionErrors) return "Please fix the errors in this section before saving."

  const walk = (obj: unknown): string | null => {
    if (!obj || typeof obj !== "object") return null
    const e = obj as Record<string, unknown>
    if (typeof e.message === "string" && e.message.trim()) return e.message
    for (const key of Object.keys(e)) {
      const found = walk(e[key])
      if (found) return found
    }
    return null
  }

  return walk(sectionErrors) ?? "Please fix the errors in this section before saving."
}

function SettingsFormInner({
  settings,
  isSaving,
  onSave,
}: SettingsFormInnerProps) {
  const values = useMemo<SettingsFormValues>(() => {
    const addresses =
      settings.county.addresses && settings.county.addresses.length > 0
        ? settings.county.addresses
        : [{ location: "", street: "", city: "", state: "", zip: "" }]
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
      fiscalYear: {
        fiscalYearStartMonth: settings.fiscalYear?.fiscalYearStartMonth ?? "2025-07-01",
        fiscalYearEndMonth: settings.fiscalYear?.fiscalYearEndMonth ?? "2026-06-30",
        year: settings.fiscalYear?.year ?? "2025-2026",
        appliedYearRanges: settings.fiscalYear?.appliedYearRanges ?? [],
        holidays: settings.fiscalYear?.holidays ?? [],
      },
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
  }, [settings])

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    values,
    mode: "onSubmit",
  })

  const showErrorToast = (message: string) => {
    toast.error(message, {
      position: "top-center",
      icon: (
        <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#ef4444] text-white">
          <X className="size-3 stroke-[2.5]" />
        </span>
      ),
      className:
        "!w-fit !max-w-[340px] !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
    })
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null
    const raw = submitter?.getAttribute("data-settings-section")
    const section = raw as SettingsFormSaveSection | undefined

    if (section && VALID_SECTIONS.includes(section)) {
      form.clearErrors()
      const isValid = await form.trigger(section)
      if (!isValid) {
        showErrorToast(resolveSectionErrorMessage(form.formState.errors, section))
        return
      }

      onSave(form.getValues(), { submitterSection: section })
      return
    }

    void form.handleSubmit(
      (values, event) => {
        const native = event?.nativeEvent as SubmitEvent | undefined
        const s = native?.submitter?.getAttribute("data-settings-section") as
          | SettingsFormSaveSection
          | undefined
        onSave(values, { submitterSection: s })
      },
      (errors) => {
        const message =
          resolveSectionErrorMessage(errors, "county") ||
          resolveSectionErrorMessage(errors, "reports") ||
          resolveSectionErrorMessage(errors, "login") ||
          resolveSectionErrorMessage(errors, "general") ||
          resolveSectionErrorMessage(errors, "payroll") ||
          resolveSectionErrorMessage(errors, "fiscalYear") ||
          "Please fix the errors before saving."
        showErrorToast(message)
      },
    )(e)
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={(e) => void handleFormSubmit(e)}>
        <SettingsAccordion isSaving={isSaving} />
      </form>
    </FormProvider>
  )
}

export function SettingsForm() {
  const settingsModule = useSettingsModule()
  const settings = settingsModule.settings
  const getSuccessMessage = (submitterSection?: SettingsFormSaveSection) =>
    (submitterSection && SECTION_SUCCESS_MESSAGES[submitterSection]) ||
    SECTION_SUCCESS_MESSAGES.county

  if (settingsModule.isLoading || !settings) {
    return (
      <div className="rounded-[8px] border border-[#e8e9ef] bg-white p-4 text-[12px] text-[#6b7280]">
        Loading...
      </div>
    )
  }

  return (
    <SettingsFormInner
      settings={settings}
      isSaving={settingsModule.isUpdating}
      onSave={(values, meta) => {
        settingsModule.updateSettings(
          { values },
          {
            onSuccess: () => {
              toast.success(getSuccessMessage(meta?.submitterSection), {
                position: "top-center",
                icon: (
                  <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
                    <Check className="size-3 stroke-[3]" />
                  </span>
                ),
                className:
                  "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
              })
            },
            onError: (error) => {
              toast.error(error.message, {
                position: "top-center",
                icon: (
                  <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#ef4444] text-white">
                    <X className="size-3 stroke-[2.5]" />
                  </span>
                ),
                className:
                  "!w-fit !max-w-[340px] !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
              })
            },
          }
        )
      }}
    />
  )
}

