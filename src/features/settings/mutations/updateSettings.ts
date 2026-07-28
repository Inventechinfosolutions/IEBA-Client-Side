import { useMutation, useQueryClient } from "@tanstack/react-query"
import { settingsKeys } from "@/features/settings/keys"
import { DEFAULT_SETTINGS } from "@/features/settings/constants"
import { SettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import type { SettingsModel, UpdateSettingsInput } from "@/features/settings/types"
import type { PayrollBy, PayrollColumnSettingModel, PayrollSettingsModel } from "../payroll"
import { updatePayrollSettings } from "../payroll"
import { api } from "@/lib/api"
import {
  createCountyLocation,
  deleteCountyLocation,
  uploadCountyLogo,
  updateCountyClient,
  updateCountyLocation,
  deleteCountyLogo,
  type UpdateCountyClientBody,
  type CountyLocationPayload,
} from "@/features/settings/components/Country/api"
import { parseLocationId } from "@/features/settings/components/Country/locationUtils"
import {
  settingsCountyClientQueryKey,
  type CountyClientDetailModel,
} from "@/features/settings/queries/getCountyClient"
import { mapCountyClientDetailToCountySettings } from "@/features/settings/components/Country/countyClientFormMap"
import { parseMasterCodeIdsFromSelection } from "@/features/settings/components/MasterCode/masterCodeForm.utils"
import { apiSaveClientMasterCodes } from "@/features/master-code/api/clientMasterCodeApi"
import { masterCodeKeys } from "@/features/master-code/keys"

function normalizeCountyLocations(values: UpdateSettingsInput["values"]): Array<{
  locationId?: number
  name: string
  street?: string
  city?: string
  state?: string
  zip?: string
  primary?: boolean
}> {
  const rows = values.county.addresses ?? []
  return rows
    .map((row: any) => ({
      locationId: parseLocationId(row.locationId),
      name: (row.location ?? "").trim(),
      street: (row.street ?? "").trim() || undefined,
      city: (row.city ?? "").trim() || undefined,
      state: (row.state ?? "").trim() || undefined,
      zip: (row.zip ?? "").trim() || undefined,
      primary: true,
    }))
    .filter((r) => r.name.length > 0)
}

async function saveCountyToBackend(
  queryClient: ReturnType<typeof useQueryClient>,
  input: UpdateSettingsInput,
): Promise<void> {
  const cached = queryClient.getQueriesData({ queryKey: settingsCountyClientQueryKey })
  const first = cached.find(([, data]) => Boolean(data))?.[1] as
    | CountyClientDetailModel
    | undefined

  if (!first?.id) {
    throw new Error("County client is not loaded yet. Please refresh and try again.")
  }

  const clientId = first.id
  const existingLocations = first.locations ?? []

  const initialCounty = mapCountyClientDetailToCountySettings(first)
  const currentCounty = input.values.county

  const updatePayload: Partial<UpdateCountyClientBody> = {}

  if (currentCounty.countyName !== initialCounty.countyName) {
    updatePayload.name = currentCounty.countyName
  }
  if (currentCounty.welcomeMessage !== initialCounty.welcomeMessage) {
    updatePayload.message = currentCounty.welcomeMessage
  }
  if (currentCounty.isTimeRangeEnabled !== initialCounty.isTimeRangeEnabled) {
    updatePayload.timeRule = Boolean(currentCounty.isTimeRangeEnabled)
  }
  if (currentCounty.startTime2 !== initialCounty.startTime2) {
    updatePayload.startTime = currentCounty.startTime2
  }
  if (currentCounty.endTime !== initialCounty.endTime) {
    updatePayload.endTime = currentCounty.endTime
  }
  if (currentCounty.autoApproval !== initialCounty.autoApproval) {
    updatePayload.autoApproval = Boolean(currentCounty.autoApproval)
  }
  if (currentCounty.supervisorApportioning !== initialCounty.supervisorApportioning) {
    updatePayload.apportioning = Boolean(currentCounty.supervisorApportioning)
  }
  if (currentCounty.includedWeekends !== initialCounty.includedWeekends) {
    updatePayload.include_weekend = Boolean(currentCounty.includedWeekends)
  }

  if (Object.keys(updatePayload).length > 0) {
    await updateCountyClient(clientId, updatePayload)
  }

  const nextLogoDataUrl = (input.values.county.logoDataUrl ?? "").trim()
  const prevLogoDataUrl = (initialCounty.logoDataUrl ?? "").trim()

  if (nextLogoDataUrl.startsWith("data:")) {
    await uploadCountyLogo(clientId, nextLogoDataUrl)
  } else if (!nextLogoDataUrl && prevLogoDataUrl) {
    await deleteCountyLogo(clientId)
  }

  const desired = normalizeCountyLocations(input.values)
  const existing = [...existingLocations].sort((a, b) => a.id - b.id)
  const existingIds = new Set(existing.map((l) => l.id))
  const existingById = new Map(existing.map((l) => [l.id, l] as const))
  const keptIds = new Set(
    desired.map((d) => d.locationId).filter((id): id is number => typeof id === "number"),
  )

  for (const loc of existing) {
    if (!keptIds.has(loc.id)) {
      await deleteCountyLocation(loc.id)
    }
  }

  for (const row of desired) {
    const payload = {
      name: row.name,
      clientId,
      street: row.street,
      city: row.city,
      state: row.state,
      zip: row.zip,
      primary: Boolean(row.primary),
      status: "active",
    }

    if (row.locationId !== undefined && existingIds.has(row.locationId)) {
      const current = existingById.get(row.locationId)
      if (current) {
        const patch: Partial<CountyLocationPayload> = {}

        const trimmedCurrentName = (current.name ?? "").trim()
        const trimmedPayloadName = payload.name.trim()
        if (trimmedCurrentName !== trimmedPayloadName) {
          patch.name = trimmedPayloadName
        }

        const trimmedCurrentStreet = (current.street ?? "").trim()
        const trimmedPayloadStreet = (payload.street ?? "").trim()
        if (trimmedCurrentStreet !== trimmedPayloadStreet) {
          patch.street = trimmedPayloadStreet || undefined
        }

        const trimmedCurrentCity = (current.city ?? "").trim()
        const trimmedPayloadCity = (payload.city ?? "").trim()
        if (trimmedCurrentCity !== trimmedPayloadCity) {
          patch.city = trimmedPayloadCity || undefined
        }

        const trimmedCurrentState = (current.state ?? "").trim()
        const trimmedPayloadState = (payload.state ?? "").trim()
        if (trimmedCurrentState !== trimmedPayloadState) {
          patch.state = trimmedPayloadState || undefined
        }

        const trimmedCurrentZip = (current.zip ?? "").trim()
        const trimmedPayloadZip = (payload.zip ?? "").trim()
        if (trimmedCurrentZip !== trimmedPayloadZip) {
          patch.zip = trimmedPayloadZip || undefined
        }

        if (Boolean(current.primary) !== Boolean(payload.primary)) {
          patch.primary = Boolean(payload.primary)
        }

        if ((current.status ?? "active") !== payload.status) {
          patch.status = payload.status
        }

        if (Object.keys(patch).length > 0) {
          await updateCountyLocation(row.locationId, patch)
        }
      }
    } else {
      await createCountyLocation(payload)
    }
  }
}

async function updateSettings(
  queryClient: ReturnType<typeof useQueryClient>,
  input: UpdateSettingsInput,
): Promise<SettingsModel> {
  let reportsAfterSave: SettingsModel["reports"] | undefined

  if (input.submitterSection === SettingsFormSaveSection.County) {
    await saveCountyToBackend(queryClient, input)
  }

  if (input.submitterSection === SettingsFormSaveSection.Reports) {
    // County report mapping saves immediately from CountyReportsMappingForm.
    // Master-code exclusion/inclusion moved to Department → Reports mapping.
    return {
      ...DEFAULT_SETTINGS,
      ...input.values,
      version: (queryClient.getQueryData<SettingsModel>(settingsKeys.detail())?.version ?? 1),
      reports: {
        ...DEFAULT_SETTINGS.reports,
        ...input.values.reports,
      },
    }
  }

  if (input.submitterSection === SettingsFormSaveSection.Login) {
    const initialSettings = queryClient.getQueryData<SettingsModel>(settingsKeys.detail()) ?? DEFAULT_SETTINGS
    const initialLogin = initialSettings.login
    const currentLogin = input.values.login

    const promises: Promise<unknown>[] = []

    const currentTwoFactorAuth = Boolean(currentLogin?.twoFactorAuthentication)
    const initialTwoFactorAuth = Boolean(initialLogin?.twoFactorAuthentication)
    if (currentTwoFactorAuth !== initialTwoFactorAuth) {
      promises.push(api.put(`/setting/TWO_FA_ENABLED`, { value: String(currentTwoFactorAuth) }))
    }

    const currentOtpTimer = currentLogin?.otpValidationTimerSeconds ?? 120
    const initialOtpTimer = initialLogin?.otpValidationTimerSeconds ?? 120
    if (Number(currentOtpTimer) !== Number(initialOtpTimer)) {
      promises.push(api.put(`/setting/OTP_VALIDATION_TIMEOUT`, { value: String(currentOtpTimer) }))
    }

    if (promises.length > 0) {
      await Promise.all(promises)
    }
  }

  if (input.submitterSection === SettingsFormSaveSection.General) {
    const initialSettings = queryClient.getQueryData<SettingsModel>(settingsKeys.detail()) ?? DEFAULT_SETTINGS
    const initialGeneral = initialSettings.general
    const currentGeneral = input.values.general

    const minutes = currentGeneral?.screenInactivityTimeMinutes ?? 120
    const initialMinutes = initialGeneral?.screenInactivityTimeMinutes ?? 120
    if (Number(minutes) !== Number(initialMinutes)) {
      await api.put(`/setting/SCREEN_INACTIVITY_TIME_IN_MIN`, { value: String(minutes) })
    }

    localStorage.setItem("SCREEN_INACTIVITY_TIME_IN_MIN", String(minutes))
    window.dispatchEvent(new StorageEvent("storage", {
      key: "SCREEN_INACTIVITY_TIME_IN_MIN",
      newValue: String(minutes),
    }))
  }

  if (input.submitterSection === SettingsFormSaveSection.MasterCode) {
    const cached = queryClient.getQueriesData({ queryKey: settingsCountyClientQueryKey })
    const countyClient = cached.find(([, data]) => Boolean(data))?.[1] as
      | CountyClientDetailModel
      | undefined

    if (!countyClient?.id) {
      throw new Error("County client is not loaded yet. Please refresh and try again.")
    }

    const masterCodeIds = parseMasterCodeIdsFromSelection(
      input.values.masterCode?.selectedMasterCodeIds,
    )

    await apiSaveClientMasterCodes(countyClient.id, masterCodeIds)
  }

  if (input.submitterSection === SettingsFormSaveSection.Payroll) {
    const payrollPayload: PayrollSettingsModel = {
      payrollBy: (input.values.payroll?.payrollBy ?? "Weekly") as PayrollBy,
      columns: (input.values.payroll?.columns ?? []).map((c: any) => ({
        key: c.key,
        label: c.label,
        enabled: Boolean(c.enabled),
        editable: Boolean(c.editable),
      })),
    }

    const prev = queryClient.getQueryData(settingsKeys.payroll.detail()) as PayrollSettingsModel | undefined
    const prevByKey = new Map((prev?.columns ?? []).map((c) => [String(c.key), c] as const))

    const changedColumns = payrollPayload.columns
      .map((nextCol, index) => {
        const prevCol = prevByKey.get(String(nextCol.key))
        const id = Number(nextCol.key)
        if (!Number.isFinite(id) || id <= 0) return null

        const patch: { id: number; columnname?: string; displayOrder?: number; isEnable?: boolean; isEditable?: boolean; slno?: number } = { id }

        // Order change
        const nextOrder = index + 1
        const prevOrder = prev?.columns ? prev.columns.findIndex((c) => String(c.key) === String(nextCol.key)) + 1 : nextOrder
        if (prev && prevOrder !== nextOrder) {
          patch.displayOrder = nextOrder
          patch.slno = nextOrder
        }

        // Field changes
        if (prevCol) {
          if (prevCol.label !== nextCol.label) patch.columnname = nextCol.label
          if (Boolean(prevCol.enabled) !== Boolean(nextCol.enabled)) patch.isEnable = Boolean(nextCol.enabled)
          if (Boolean(prevCol.editable) !== Boolean(nextCol.editable)) patch.isEditable = Boolean(nextCol.editable)
        } else {
          // If we don't have a baseline, send full row fields (still as bulk)
          patch.columnname = nextCol.label
          patch.displayOrder = nextOrder
          patch.isEnable = Boolean(nextCol.enabled)
          patch.isEditable = Boolean(nextCol.editable)
          patch.slno = nextOrder
        }

        // Only keep if something changed (besides id)
        const { id: _id, ...rest } = patch
        return Object.keys(rest).length > 0 ? patch : null
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)

    const payrollByChanged = prev ? prev.payrollBy !== payrollPayload.payrollBy : true

    // Ensure spinner is visible for at least a brief moment for UX consistency
    await Promise.all([
      updatePayrollSettings({
        payrollBy: payrollByChanged ? payrollPayload.payrollBy : undefined,
        columns: changedColumns.length > 0 ? changedColumns : undefined,
      }),
      new Promise((resolve) => setTimeout(resolve, 400)),
    ])
  }

  const next: SettingsModel = {
    version: (input.values as any).version ?? 1,
    county: {
      ...DEFAULT_SETTINGS.county,
      ...input.values.county,
      logoDataUrl: input.values.county.logoDataUrl ?? null,
      welcomeMessage: input.values.county.welcomeMessage ?? "",
      isTimeRangeEnabled: Boolean(input.values.county.isTimeRangeEnabled),
      addresses: (input.values.county.addresses ?? []).map((row: any) => ({
        locationId: parseLocationId(row.locationId),
        location: row.location ?? "",
        street: row.street ?? "",
        city: row.city ?? "",
        state: row.state ?? "",
        zip: row.zip ?? "",
      })),
    },
    general: {
      ...DEFAULT_SETTINGS.general,
      ...input.values.general,
      screenInactivityTimeMinutes: Number(input.values.general.screenInactivityTimeMinutes),
    },
    reports: reportsAfterSave ?? {
      ...DEFAULT_SETTINGS.reports,
      ...input.values.reports,
      reportKey: String(input.values.reports.reportKey ?? ""),
      masterCodeExclusionMode:
        input.values.reports.masterCodeExclusionMode === "include" ? "include" : "exclude",
      activityExclusionMode:
        input.values.reports.activityExclusionMode === "include" ? "include" : "exclude",
      excludedMasterCodeIds: Array.isArray(input.values.reports.excludedMasterCodeIds)
        ? input.values.reports.excludedMasterCodeIds.map(String)
        : [],
      includedMasterCodeIds: Array.isArray(input.values.reports.includedMasterCodeIds)
        ? input.values.reports.includedMasterCodeIds.map(String)
        : [],
      excludedActivityCodes: Array.isArray(input.values.reports.excludedActivityCodes)
        ? input.values.reports.excludedActivityCodes.map(String)
        : [],
      includedActivityCodes: Array.isArray(input.values.reports.includedActivityCodes)
        ? input.values.reports.includedActivityCodes.map(String)
        : [],
    },
    login: {
      ...DEFAULT_SETTINGS.login,
      ...input.values.login,
      otpValidationTimerSeconds: Number(input.values.login.otpValidationTimerSeconds),
    },
    fiscalYear: {
      ...DEFAULT_SETTINGS.fiscalYear,
    },
    payroll: {
      ...DEFAULT_SETTINGS.payroll,
      ...input.values.payroll,
      payrollBy: String(input.values.payroll?.payrollBy ?? "Weekly") as PayrollBy,
      columns: Array.isArray(input.values.payroll?.columns)
        ? (input.values.payroll.columns as any[]).map((row) => {
            const col = row as PayrollColumnSettingModel
            return {
              key: String(col.key ?? ""),
              label: String(col.label ?? ""),
              enabled: Boolean(col.enabled),
              editable: Boolean(col.editable),
            }
          })
        : [],
    },
    masterCode: {
      ...DEFAULT_SETTINGS.masterCode,
      selectedMasterCodeIds: String(input.values.masterCode?.selectedMasterCodeIds ?? ""),
    },
  }

  return next
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => updateSettings(queryClient, input),
    onSuccess: (data, variables) => {
      if (variables.submitterSection === SettingsFormSaveSection.Payroll) {
        // Only invalidate payroll query — does NOT trigger general settings refetch
        void queryClient.invalidateQueries({ queryKey: settingsKeys.payroll.detail() })
      } else {
        // All other sections update the cached settings data directly
        queryClient.setQueryData(settingsKeys.detail(), data)
        // County also needs the county client refreshed
        if (variables.submitterSection === SettingsFormSaveSection.County) {
          void queryClient.invalidateQueries({ queryKey: settingsCountyClientQueryKey })
        }
        if (variables.submitterSection === SettingsFormSaveSection.Reports) {
          const deptId = variables.values.reports?.departmentId?.trim() ?? ""
          if (deptId) {
            void queryClient.invalidateQueries({
              queryKey: settingsKeys.reports.byDepartment(deptId),
            })
          }
        }
        if (variables.submitterSection === SettingsFormSaveSection.MasterCode) {
          const cached = queryClient.getQueriesData({ queryKey: settingsCountyClientQueryKey })
          const countyClient = cached.find(([, data]) => Boolean(data))?.[1] as
            | CountyClientDetailModel
            | undefined
          if (countyClient?.id) {
            void queryClient.invalidateQueries({
              queryKey: settingsKeys.masterCode.list(countyClient.id),
            })
            void queryClient.invalidateQueries({
              queryKey: masterCodeKeys.clientTabs(countyClient.id),
            })
            void queryClient.invalidateQueries({
              queryKey: masterCodeKeys.clientMasterCodes(countyClient.id),
            })
          }
        }
      }
    },
  })
}
