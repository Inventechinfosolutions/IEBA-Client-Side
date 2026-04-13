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
  getSettingsFormFirstErrorMessage,
  getSettingsFormSectionErrorMessage,
  mapToSettingsFormValues,
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

function getSettingsSaveSuccessMessage(submitterSection?: SettingsFormSaveSection) {
  return (
    (submitterSection && SETTINGS_FORM_SECTION_SUCCESS_MESSAGES[submitterSection]) ||
    SETTINGS_FORM_SECTION_SUCCESS_MESSAGES[SettingsFormSaveSection.County]
  )
}

function SettingsFormInner({ settings, isSaving, onSubmitSettings }: SettingsFormInnerProps) {
  const { derivedFiscalYear, fiscalYearUi } = useSettingsFormFiscalState()
  const countyClientQuery = useGetCountyClient(true)

  const formValues = useMemo((): SettingsFormValues => {
    const base = mapToSettingsFormValues(settings, derivedFiscalYear)
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
    if (isSaving) return

    const native = e.nativeEvent as SubmitEvent
    // Robust submitter discovery
    const submitter = (native.submitter || document.activeElement) as HTMLElement | null
    const attr = submitter?.getAttribute("data-settings-section")
    const submitterSection = isSettingsFormSaveSection(attr) ? attr : undefined

    // Clear previous errors so validation state is fresh for the current section
    form.clearErrors()

    // Trigger validation for the section OR the whole form
    const isValid = submitterSection 
      ? await form.trigger(submitterSection) 
      : await form.trigger()

    if (!isValid) {
      const message = submitterSection 
        ? getSettingsFormSectionErrorMessage(form.formState.errors, submitterSection)
        : getSettingsFormFirstErrorMessage(form.formState.errors)
      showSettingsFormErrorToast(message)
      return
    }

    onSubmitSettings(form.getValues(), { submitterSection })
  }

  return (
    <SettingsFiscalYearUiProvider value={fiscalYearUi}>
      <FormProvider {...form}>
        <form onSubmit={handleSettingsFormSubmit}>
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
              showSettingsFormSuccessToast(getSettingsSaveSuccessMessage(meta?.submitterSection))
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
