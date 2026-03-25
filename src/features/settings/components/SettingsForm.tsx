import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Check, X } from "lucide-react"

import { settingsFormSchema } from "@/features/settings/schemas"
import { useSettingsModule } from "@/features/settings/hooks/useSettingsModule"
import type { SettingsFormValues, SettingsModel } from "@/features/settings/types"
import { SettingsAccordion } from "@/features/settings/components/SettingsAccordion"

function SettingsFormInner({
  settings,
  isSaving,
  onSave,
}: {
  settings: SettingsModel
  isSaving: boolean
  onSave: (values: SettingsFormValues) => void
}) {
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
        startTime1: settings.county.startTime1,
        startTime2: settings.county.startTime2,
        endTime: settings.county.endTime,
        includedWeekends: settings.county.includedWeekends,
        autoApproval: settings.county.autoApproval,
        supervisorApportioning: settings.county.supervisorApportioning,
        addresses,
      },
      general: {
        screenInactivityTimeMinutes: settings.general?.screenInactivityTimeMinutes ?? 120,
      },
      reports: {
        reportKey: settings.reports?.reportKey ?? "DSSRPT1",
        exclusionMode: settings.reports?.exclusionMode ?? "exclude",
        selectedActivityCodes: settings.reports?.selectedActivityCodes ?? [],
      },
      login: {
        twoFactorAuthentication: settings.login?.twoFactorAuthentication ?? false,
        otpValidationTimerSeconds: settings.login?.otpValidationTimerSeconds ?? 120,
      },
    }
  }, [settings])

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: values,
    mode: "onSubmit",
  })

  const handleSave = form.handleSubmit(
    (values) => {
      onSave(values)
    },
    (errors) => {
      const first =
        errors.county?.countyName?.message ||
        errors.county?.startTime1?.message ||
        errors.county?.startTime2?.message ||
        errors.county?.endTime?.message ||
        errors.general?.screenInactivityTimeMinutes?.message ||
        errors.reports?.reportKey?.message ||
        errors.login?.otpValidationTimerSeconds?.message ||
        (Array.isArray(errors.county?.addresses) ? errors.county?.addresses[0] : undefined)
      const message =
        typeof first === "string"
          ? first
          : "Please check required fields and try again."

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
  )

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSave}>
        <SettingsAccordion isSaving={isSaving} />
      </form>
    </FormProvider>
  )
}

export function SettingsForm() {
  const settingsModule = useSettingsModule()
  const settings = settingsModule.settings

  if (settingsModule.isLoading || !settings) {
    return (
      <div className="rounded-[8px] border border-[#e8e9ef] bg-white p-4 text-[12px] text-[#6b7280]">
        Loading...
      </div>
    )
  }

  return (
    <SettingsFormInner
      key={settings.version}
      settings={settings}
      isSaving={settingsModule.isUpdating}
      onSave={(values) => {
        settingsModule.updateSettings(
          { values },
          {
            onSuccess: () => {
              toast.success("Settings saved successfully", {
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

