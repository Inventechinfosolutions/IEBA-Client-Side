import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo, useState } from "react"
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
import { Spinner } from "@/components/ui/spinner"

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
  const [openSection, setOpenSection] = useState<string | undefined>(undefined)
  const countyClientQuery = useGetCountyClient(openSection === "County")

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

    if (submitterSection) {
      const currentSectionVal = form.getValues(submitterSection as any)
      const initialSectionVal = formValues[submitterSection as keyof typeof formValues]

      let hasChanges = true
      if (submitterSection === SettingsFormSaveSection.General) {
        const cur = currentSectionVal as SettingsFormValues["general"]
        const init = initialSectionVal as SettingsFormValues["general"]
        hasChanges = Number(cur.screenInactivityTimeMinutes) !== Number(init.screenInactivityTimeMinutes)
      } else if (submitterSection === SettingsFormSaveSection.Login) {
        const cur = currentSectionVal as SettingsFormValues["login"]
        const init = initialSectionVal as SettingsFormValues["login"]
        hasChanges =
          cur.twoFactorAuthentication !== init.twoFactorAuthentication ||
          Number(cur.otpValidationTimerSeconds) !== Number(init.otpValidationTimerSeconds)
      } else if (submitterSection === SettingsFormSaveSection.Reports) {
        const cur = currentSectionVal as SettingsFormValues["reports"]
        const init = initialSectionVal as SettingsFormValues["reports"]
        const keySame = cur.reportKey === init.reportKey
        const modeSame = cur.exclusionMode === init.exclusionMode
        const curCodes = cur.selectedActivityCodes ?? []
        const initCodes = init.selectedActivityCodes ?? []
        let codesSame = curCodes.length === initCodes.length
        if (codesSame) {
          const initSet = new Set(initCodes.map(String))
          codesSame = curCodes.every((c: any) => initSet.has(String(c)))
        }
        hasChanges = !keySame || !modeSame || !codesSame
      } else if (submitterSection === SettingsFormSaveSection.Payroll) {
        const cur = currentSectionVal as SettingsFormValues["payroll"]
        const init = initialSectionVal as SettingsFormValues["payroll"]
        const bySame = cur.payrollBy === init.payrollBy
        const curCols = cur.columns ?? []
        const initCols = init.columns ?? []
        let colsSame = curCols.length === initCols.length
        if (colsSame) {
          for (let i = 0; i < curCols.length; i++) {
            const cC = curCols[i]
            const iC = initCols[i]
            if (
              String(cC.key) !== String(iC.key) ||
              cC.label !== iC.label ||
              Boolean(cC.enabled) !== Boolean(iC.enabled) ||
              Boolean(cC.editable) !== Boolean(iC.editable)
            ) {
              colsSame = false
              break
            }
          }
        }
        hasChanges = !bySame || !colsSame
      } else if (submitterSection === SettingsFormSaveSection.County) {
        const cur = currentSectionVal as SettingsFormValues["county"]
        const init = initialSectionVal as SettingsFormValues["county"]
        const logoSame = (cur.logoDataUrl ?? null) === (init.logoDataUrl ?? null)
        const nameSame = cur.countyName === init.countyName
        const msgSame = cur.welcomeMessage === init.welcomeMessage
        const rangeSame = cur.isTimeRangeEnabled === init.isTimeRangeEnabled
        const startTimeSame = cur.startTime2 === init.startTime2
        const endTimeSame = cur.endTime === init.endTime
        const weekendSame = cur.includedWeekends === init.includedWeekends
        const autoSame = cur.autoApproval === init.autoApproval
        const apportionSame = cur.supervisorApportioning === init.supervisorApportioning
        
        const curAddrs = cur.addresses ?? []
        const initAddrs = init.addresses ?? []
        let addrsSame = curAddrs.length === initAddrs.length
        if (addrsSame) {
          for (let i = 0; i < curAddrs.length; i++) {
            const cA = curAddrs[i]
            const iA = initAddrs[i]
            if (
              String(cA.locationId ?? "") !== String(iA.locationId ?? "") ||
              (cA.location ?? "").trim() !== (iA.location ?? "").trim() ||
              (cA.street ?? "").trim() !== (iA.street ?? "").trim() ||
              (cA.city ?? "").trim() !== (iA.city ?? "").trim() ||
              (cA.state ?? "").trim() !== (iA.state ?? "").trim() ||
              (cA.zip ?? "").trim() !== (iA.zip ?? "").trim()
            ) {
              addrsSame = false
              break
            }
          }
        }
        hasChanges = !logoSame || !nameSame || !msgSame || !rangeSame || !startTimeSame || !endTimeSame || !weekendSame || !autoSame || !apportionSame || !addrsSame
      }

      if (!hasChanges) {
        showSettingsFormErrorToast("No changes to save")
        return
      }
    }

    onSubmitSettings(form.getValues(), { submitterSection })
  }

  return (
    <SettingsFiscalYearUiProvider value={fiscalYearUi}>
      <FormProvider {...form}>
        <form onSubmit={handleSettingsFormSubmit}>
          <SettingsAccordion
            isSaving={isSaving}
            openSection={openSection}
            onOpenSectionChange={setOpenSection}
          />
        </form>
      </FormProvider>
    </SettingsFiscalYearUiProvider>
  )
}

export function SettingsForm() {
  const { settings, isLoading, isSaving, saveSettings } = useSettingsFormData()

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center rounded-[8px] border border-[#e8e9ef] bg-white p-8">
        <Spinner className="text-[#6C5DD3]" />
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
