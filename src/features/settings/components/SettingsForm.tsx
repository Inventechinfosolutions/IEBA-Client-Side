import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Check, X } from "lucide-react"

import { SettingsFiscalYearUiProvider } from "@/features/settings/context/SettingsFiscalYearUiProvider"
import { SettingsFormSaveSection, isSettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import { useSettingsFormData } from "@/features/settings/hooks/useSettingsFormData"
import { useSettingsFormFiscalState } from "@/features/settings/hooks/useSettingsFormFiscalState"
import { SETTINGS_FORM_SECTION_SUCCESS_MESSAGES } from "@/features/settings/settingsForm.constants"
import {
  buildSettingsFormValues,
  resolveFirstSettingsFormErrorMessage,
  resolveSettingsFormSectionErrorMessage,
} from "@/features/settings/settingsForm.utils"
import { settingsFormSchema } from "@/features/settings/schemas"
import type { SettingsFormInnerProps, SettingsFormValues } from "@/features/settings/types"
import { mapCountyClientDetailToCountySettings } from "@/features/settings/components/Country/countyClientFormMap"
import { SettingsAccordion } from "@/features/settings/components/SettingsAccordion"
import { useGetCountyClient } from "@/features/settings/queries/getCountyClient"

function showSettingsFormErrorToast(message: string) {
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

function showSettingsFormSuccessToast(message: string) {
  toast.success(message, {
    position: "top-center",
    icon: (
      <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
        <Check className="size-3 stroke-[3]" />
      </span>
    ),
    className:
      "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
  })
}

function resolveSettingsSaveSuccessMessage(submitterSection?: SettingsFormSaveSection) {
  return (
    (submitterSection && SETTINGS_FORM_SECTION_SUCCESS_MESSAGES[submitterSection]) ||
    SETTINGS_FORM_SECTION_SUCCESS_MESSAGES[SettingsFormSaveSection.County]
  )
}

function SettingsFormInner({ settings, isSaving, onSubmitSettings }: SettingsFormInnerProps) {
  const { derivedFiscalYear, fiscalYearUi } = useSettingsFormFiscalState()
  const countyClientQuery = useGetCountyClient(true)

  const formValues = useMemo((): SettingsFormValues => {
    const base = buildSettingsFormValues(settings, derivedFiscalYear)
    if (!countyClientQuery.data) return base
    return {
      ...base,
      county: mapCountyClientDetailToCountySettings(countyClientQuery.data),
    }
  }, [settings, derivedFiscalYear, countyClientQuery.data])

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    values: formValues,
    mode: "onSubmit",
    resetOptions: {
      keepDirtyValues: true,
    },
  })

  const handleSettingsFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null
    const rawSection = submitter?.getAttribute("data-settings-section")

    if (isSettingsFormSaveSection(rawSection)) {
      form.clearErrors()
      const isValid = await form.trigger(rawSection)
      if (!isValid) {
        showSettingsFormErrorToast(
          resolveSettingsFormSectionErrorMessage(form.formState.errors, rawSection),
        )
        return
      }

      onSubmitSettings(form.getValues(), { submitterSection: rawSection })
      return
    }

    void form.handleSubmit(
      (submittedValues, event) => {
        const native = event?.nativeEvent as SubmitEvent | undefined
        const attr = native?.submitter?.getAttribute("data-settings-section")
        const submitterSection = isSettingsFormSaveSection(attr) ? attr : undefined
        onSubmitSettings(submittedValues, { submitterSection })
      },
      (errors) => {
        showSettingsFormErrorToast(resolveFirstSettingsFormErrorMessage(errors))
      },
    )(e)
  }

  return (
    <SettingsFiscalYearUiProvider value={fiscalYearUi}>
      <FormProvider {...form}>
        <form onSubmit={(e) => void handleSettingsFormSubmit(e)}>
          <SettingsAccordion isSaving={isSaving} />
        </form>
      </FormProvider>
    </SettingsFiscalYearUiProvider>
  )
}

export function SettingsForm() {
  const { settings, isLoading, isSaving, saveSettings } = useSettingsFormData()

  if (isLoading || !settings) {
    return (
      <div className="rounded-[8px] border border-[#e8e9ef] bg-white p-4 text-[12px] text-[#6b7280]">
        Loading...
      </div>
    )
  }

  return (
    <SettingsFormInner
      settings={settings}
      isSaving={isSaving}
      onSubmitSettings={(values, meta) => {
        saveSettings(
          { values, submitterSection: meta?.submitterSection },
          {
            onSuccess: () => {
              showSettingsFormSuccessToast(resolveSettingsSaveSuccessMessage(meta?.submitterSection))
            },
            onError: (error) => {
              showSettingsFormErrorToast(error.message)
            },
          },
        )
      }}
    />
  )
}
