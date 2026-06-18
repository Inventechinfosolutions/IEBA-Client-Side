import { useMutation, useQueryClient } from "@tanstack/react-query"
import { settingsKeys } from "@/features/settings/keys"
import { DEFAULT_SETTINGS } from "@/features/settings/constants"
import { SettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import type { ReportOption, SettingsModel, UpdateSettingsInput } from "@/features/settings/types"
import type { PayrollBy, PayrollColumnSettingModel, PayrollSettingsModel } from "../payroll"
import { updatePayrollSettings } from "../payroll"
import { api } from "@/lib/api"
import { buildReportMasterCodeSavePayload } from "@/features/reports/lib/reportMasterCodeData.utils"
import { buildActivityTransferQueryParams } from "@/features/settings/components/Reports/reportsTransfer.utils"
import { mapRawReportsToReportOptions } from "@/features/settings/lib/reportOptions.utils"
import { fetchReportTransferFlags } from "@/features/settings/queries/getReportTransferFlags"
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
    const departmentId = input.values.reports?.departmentId?.trim() ?? ""
    const reportOptions =
      queryClient.getQueryData<ReportOption[]>(settingsKeys.reports.byDepartment(departmentId)) ??
      []
    const selectedReportKey = input.values.reports?.reportKey
    const selectedReport = reportOptions.find((r) => r.key === selectedReportKey)

    if (!selectedReport?.id) {
      throw new Error("Please select department and report before saving")
    }

    const masterCodeExclusionMode =
      input.values.reports?.masterCodeExclusionMode === "include" ? "include" : "exclude"
    const activityExclusionMode =
      input.values.reports?.activityExclusionMode === "include" ? "include" : "exclude"
    const inclusionType = masterCodeExclusionMode === "include" ? "included" : "excluded"
    const saveScope = input.reportsSaveScope

    const assignedMasterCodeIds = input.values.reports?.includedMasterCodeIds ?? []
    const unassignedMasterCodeIds = input.values.reports?.excludedMasterCodeIds ?? []
    const assignedActivityCodes = input.values.reports?.includedActivityCodes ?? []
    const unassignedActivityCodes = input.values.reports?.excludedActivityCodes ?? []

    let finalExcludedIds = unassignedMasterCodeIds
    let finalIncludedIds = assignedMasterCodeIds
    let finalExcludedActivityCodes = unassignedActivityCodes
    let finalIncludedActivityCodes = assignedActivityCodes

    if (saveScope === "masterCodes") {
      finalIncludedActivityCodes = []
      finalExcludedActivityCodes = []
    }

    const { excludedMasterCodeData, includedMasterCodeData } = buildReportMasterCodeSavePayload(
      finalExcludedIds,
      finalExcludedActivityCodes,
      finalIncludedIds,
      finalIncludedActivityCodes,
    )

    const reportdata = finalIncludedActivityCodes.join(",")

    const putRes = await api.put<unknown>(`/report/${selectedReport.id}`, {
      name: selectedReport.label.replace(new RegExp(`^${selectedReport.key}\\s*`), ""),
      filename: selectedReport.filename,
      path: selectedReport.path,
      type: inclusionType,
      reportdata,
      excludedMasterCodeData,
      includedMasterCodeData,
      status: selectedReport.status ?? "active",
    })

    const putRow = ((putRes as { data?: unknown })?.data ?? putRes) as Record<string, unknown>
    const updatedReportOption = mapRawReportsToReportOptions([putRow])[0]

    queryClient.setQueryData<ReportOption[]>(
      settingsKeys.reports.byDepartment(departmentId),
      (prev) => {
        const list = prev ?? []
        return list.map((r) => (r.key === selectedReportKey ? { ...r, ...updatedReportOption } : r))
      },
    )

    reportsAfterSave = {
      departmentId,
      reportKey: selectedReportKey ?? "",
      masterCodeExclusionMode,
      activityExclusionMode,
      excludedMasterCodeIds: (updatedReportOption.excludedMasterCodeData?.masterCodeIds ?? []).map(
        String,
      ),
      includedMasterCodeIds: (updatedReportOption.includedMasterCodeData?.masterCodeIds ?? []).map(
        String,
      ),
      excludedActivityCodes: updatedReportOption.excludedMasterCodeData?.activityCodes ?? [],
      includedActivityCodes: updatedReportOption.includedMasterCodeData?.activityCodes ?? [],
    }

    const masterCodeBucketMode = input.reportsBucketMode ?? masterCodeExclusionMode
    const refreshedMcPickerIds = (
      masterCodeBucketMode === "include"
        ? reportsAfterSave.includedMasterCodeIds
        : reportsAfterSave.excludedMasterCodeIds
    )
      .map((id) => Number(id))
      .filter((n) => Number.isFinite(n) && n >= 1)

    const activityBucketMode =
      saveScope === "activities"
        ? (input.reportsBucketMode ?? activityExclusionMode)
        : activityExclusionMode
    const savedIncludedActCodes = input.values.reports?.includedActivityCodes ?? []
    const savedExcludedActCodes = input.values.reports?.excludedActivityCodes ?? []
    const refreshedActivityQuery = buildActivityTransferQueryParams(
      activityBucketMode,
      savedIncludedActCodes,
      savedExcludedActCodes,
    )

    const mcIdsKey = refreshedMcPickerIds
      .slice()
      .sort((a, b) => a - b)
      .join(",")
    const selectedCodesKey = [...new Set(refreshedActivityQuery.selectedActivityCodes)]
      .sort()
      .join(",")
    const excludedCodesKey = [...new Set(refreshedActivityQuery.excludedActivityCodes)]
      .sort()
      .join(",")

    await queryClient.fetchQuery({
      queryKey: settingsKeys.reports.transferFlags(
        masterCodeBucketMode,
        mcIdsKey,
        refreshedActivityQuery.queryActivityMode,
        selectedCodesKey,
        excludedCodesKey,
      ),
      queryFn: () =>
        fetchReportTransferFlags({
          masterCodeMode: masterCodeBucketMode,
          selectedMasterCodeIds: refreshedMcPickerIds,
          activityMode: refreshedActivityQuery.queryActivityMode,
          selectedActivityCodes: refreshedActivityQuery.selectedActivityCodes,
          excludedActivityCodes: refreshedActivityQuery.excludedActivityCodes,
        }),
    })
  }

  if (input.submitterSection === SettingsFormSaveSection.Login) {
    const twoFactorAuth = Boolean(input.values.login?.twoFactorAuthentication)
    const otpTimer = input.values.login?.otpValidationTimerSeconds ?? 120
    
    await Promise.all([
      api.put(`/setting/TWO_FA_ENABLED`, { value: String(twoFactorAuth) }),
      api.put(`/setting/OTP_VALIDATION_TIMEOUT`, { value: String(otpTimer) }),
    ])
  }

  if (input.submitterSection === SettingsFormSaveSection.General) {
    const minutes = input.values.general?.screenInactivityTimeMinutes ?? 120
    await api.put(`/setting/SCREEN_INACTIVITY_TIME_IN_MIN`, { value: String(minutes) })
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
  }

  return next
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => updateSettings(queryClient, input),
    onSuccess: (_data, variables) => {
      if (variables.submitterSection === SettingsFormSaveSection.Payroll) {
        // Only invalidate payroll query — does NOT trigger general settings refetch
        void queryClient.invalidateQueries({ queryKey: settingsKeys.payroll.detail() })
      } else {
        // All other sections invalidate settings detail only
        void queryClient.invalidateQueries({ queryKey: settingsKeys.detail() })
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
      }
    },
  })
}
