import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Check, X } from "lucide-react"

import { guardNoChanges } from "@/lib/formGuard"
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
import { normalizeMasterCodeSelection } from "@/features/settings/components/MasterCode/masterCodeForm.utils"
import { SettingsAccordion } from "@/features/settings/components/SettingsAccordion"
import { useGetCountyClient } from "@/features/settings/queries/getCountyClient"
import { useSettingsMasterCodeList } from "@/features/settings/queries/getSettingsMasterCodeList"
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

function normalizeCountyForComparison(val: any) {
  if (!val) return null
  const addresses = (val.addresses ?? [])
    .map((addr: any) => ({
      location: (addr.location ?? "").trim(),
      street: (addr.street ?? "").trim(),
      city: (addr.city ?? "").trim(),
      state: (addr.state ?? "").trim(),
      zip: (addr.zip ?? "").trim(),
    }))
    .filter((addr: any) => addr.location.length > 0)

  return {
    logoDataUrl: val.logoDataUrl || null,
    countyName: (val.countyName ?? "").trim(),
    welcomeMessage: (val.welcomeMessage ?? "").trim(),
    isTimeRangeEnabled: Boolean(val.isTimeRangeEnabled),
    startTime2: val.startTime2 ?? "00:00",
    endTime: val.endTime ?? "00:00",
    includedWeekends: Boolean(val.includedWeekends),
    autoApproval: Boolean(val.autoApproval),
    supervisorApportioning: Boolean(val.supervisorApportioning),
    addresses,
  }
}

function SettingsFormInner({ settings, isSaving, onSubmitSettings }: SettingsFormInnerProps) {
  const { derivedFiscalYear, fiscalYearUi } = useSettingsFormFiscalState()
  const [openSection, setOpenSection] = useState<string | undefined>(undefined)
  const isMasterCodeSectionOpen = openSection === "Master Code"
  const countyClientQuery = useGetCountyClient(
    openSection === "County" || isMasterCodeSectionOpen,
  )
  const masterCodeListQuery = useSettingsMasterCodeList(
    countyClientQuery.data?.id,
    isMasterCodeSectionOpen,
  )

  const formValues = useMemo((): SettingsFormValues => {
    const base = mapToSettingsFormValues(settings, derivedFiscalYear)
    const withCounty =
      openSection === "County" && countyClientQuery.data
        ? { ...base, county: mapCountyClientDetailToCountySettings(countyClientQuery.data) }
        : base

    if (!isMasterCodeSectionOpen || !masterCodeListQuery.data) return withCounty

    return {
      ...withCounty,
      masterCode: {
        selectedMasterCodeIds: masterCodeListQuery.data.selectedMasterCodeIds,
      },
    }
  }, [
    settings,
    derivedFiscalYear,
    openSection,
    isMasterCodeSectionOpen,
    countyClientQuery.data,
    masterCodeListQuery.data,
  ])

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
    const scopeAttr = submitter?.getAttribute("data-reports-save-scope")
    const reportsSaveScope =
      scopeAttr === "masterCodes" || scopeAttr === "activities" ? scopeAttr : undefined
    const bucketModeAttr = submitter?.getAttribute("data-reports-bucket-mode")
    const reportsBucketMode =
      bucketModeAttr === "include" || bucketModeAttr === "exclude" ? bucketModeAttr : undefined

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
      let currentCompare: any = form.getValues()[submitterSection]
      let referenceCompare: any = formValues[submitterSection]

      if (submitterSection === SettingsFormSaveSection.County) {
        currentCompare = normalizeCountyForComparison(currentCompare)
        referenceCompare = normalizeCountyForComparison(referenceCompare)
      } else if (submitterSection === SettingsFormSaveSection.Payroll) {
        const normalizePayroll = (val: any) => ({
          payrollBy: val?.payrollBy,
          columns: (val?.columns ?? []).map((c: any) => ({
            key: String(c.key ?? ""),
            label: String(c.label ?? ""),
            enabled: Boolean(c.enabled),
            editable: Boolean(c.editable),
          }))
        })
        currentCompare = normalizePayroll(currentCompare)
        referenceCompare = normalizePayroll(referenceCompare)
      } else if (submitterSection === SettingsFormSaveSection.Reports) {
        const normalizeReports = (val: any) => {
          const sortStrArray = (arr: any) => Array.isArray(arr) ? arr.map(String).sort() : []
          return {
            departmentId: (val?.departmentId ?? "").trim(),
            reportKey: (val?.reportKey ?? "").trim(),
            masterCodeExclusionMode: val?.masterCodeExclusionMode ?? "exclude",
            activityExclusionMode: val?.activityExclusionMode ?? "exclude",
            excludedMasterCodeIds: sortStrArray(val?.excludedMasterCodeIds),
            includedMasterCodeIds: sortStrArray(val?.includedMasterCodeIds),
            excludedActivityCodes: sortStrArray(val?.excludedActivityCodes),
            includedActivityCodes: sortStrArray(val?.includedActivityCodes),
          }
        }
        currentCompare = normalizeReports(currentCompare)
        referenceCompare = normalizeReports(referenceCompare)
      } else if (submitterSection === SettingsFormSaveSection.Login) {
        const normalizeLogin = (val: any) => ({
          twoFactorAuthentication: Boolean(val?.twoFactorAuthentication),
          otpValidationTimerSeconds: Number(val?.otpValidationTimerSeconds ?? 120),
        })
        currentCompare = normalizeLogin(currentCompare)
        referenceCompare = normalizeLogin(referenceCompare)
      } else if (submitterSection === SettingsFormSaveSection.General) {
        const normalizeGeneral = (val: any) => ({
          screenInactivityTimeMinutes: Number(val?.screenInactivityTimeMinutes ?? 120),
        })
        currentCompare = normalizeGeneral(currentCompare)
        referenceCompare = normalizeGeneral(referenceCompare)
      } else if (submitterSection === SettingsFormSaveSection.MasterCode) {
        const normalizeMasterCode = (val: { selectedMasterCodeIds?: string } | undefined) =>
          normalizeMasterCodeSelection(val?.selectedMasterCodeIds)
        currentCompare = normalizeMasterCode(currentCompare)
        referenceCompare = normalizeMasterCode(referenceCompare)
      }

      if (guardNoChanges(currentCompare, referenceCompare)) {
        return
      }
    }

    onSubmitSettings(form.getValues(), { submitterSection, reportsSaveScope, reportsBucketMode })
  }

  return (
    <SettingsFiscalYearUiProvider value={fiscalYearUi}>
      <FormProvider {...form}>
        <form onSubmit={handleSettingsFormSubmit}>
          <SettingsAccordion
            isSaving={isSaving}
            openSection={openSection}
            onOpenSectionChange={setOpenSection}
            countyClientId={countyClientQuery.data?.id}
            masterCodeOptions={masterCodeListQuery.data?.options ?? []}
            isMasterCodeLoading={
              isMasterCodeSectionOpen &&
              (countyClientQuery.isPending ||
                countyClientQuery.isFetching ||
                masterCodeListQuery.isPending ||
                masterCodeListQuery.isFetching)
            }
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
          {
            values,
            submitterSection: meta?.submitterSection,
            reportsSaveScope: meta?.reportsSaveScope,
            reportsBucketMode: meta?.reportsBucketMode,
          },
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
