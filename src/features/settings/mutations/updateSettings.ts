import { useMutation, useQueryClient } from "@tanstack/react-query"
import { settingsKeys } from "@/features/settings/keys"
import { DEFAULT_SETTINGS } from "@/features/settings/constants"
import { SettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import type { SettingsModel, UpdateSettingsInput } from "@/features/settings/types"
import type { PayrollBy, PayrollColumnSettingModel, PayrollSettingsModel } from "../payroll"
import { updatePayrollSettings } from "../payroll"
import {
  createCountyLocation,
  deleteCountyLocation,
  uploadCountyLogo,
  updateCountyClient,
  updateCountyLocation,
} from "@/features/settings/components/Country/api"
import { parseLocationId } from "@/features/settings/components/Country/locationUtils"
import {
  settingsCountyClientQueryKey,
  type ClientLocation,
} from "@/features/settings/queries/getCountyClient"

type LocationModel = ClientLocation

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
    | { id: number; locations?: LocationModel[] | null }
    | undefined

  if (!first?.id) {
    throw new Error("County client is not loaded yet. Please refresh and try again.")
  }

  const clientId = first.id
  const existingLocations = first.locations ?? []

  await updateCountyClient(clientId, {
    name: input.values.county.countyName,
    message: input.values.county.welcomeMessage ?? "",
    timeRule: Boolean(input.values.county.isTimeRangeEnabled),
    startTime: input.values.county.startTime2,
    endTime: input.values.county.endTime,
    autoApproval: Boolean(input.values.county.autoApproval),
    apportioning: Boolean(input.values.county.supervisorApportioning),
    include_weekend: Boolean(input.values.county.includedWeekends),
  })

  const nextLogoDataUrl = (input.values.county.logoDataUrl ?? "").trim()
  if (nextLogoDataUrl.startsWith("data:")) {
    await uploadCountyLogo(clientId, nextLogoDataUrl)
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
      const same =
        !!current &&
        (current.name ?? "").trim() === payload.name.trim() &&
        (current.street ?? "").trim() === (payload.street ?? "").trim() &&
        (current.city ?? "").trim() === (payload.city ?? "").trim() &&
        (current.state ?? "").trim() === (payload.state ?? "").trim() &&
        (current.zip ?? "").trim() === (payload.zip ?? "").trim() &&
        Boolean(current.primary) === Boolean(payload.primary) &&
        (current.status ?? "active") === payload.status

      if (!same) {
        await updateCountyLocation(row.locationId, payload)
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
  if (input.submitterSection === SettingsFormSaveSection.County) {
    await saveCountyToBackend(queryClient, input)
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

    await updatePayrollSettings({
      payrollBy: payrollByChanged ? payrollPayload.payrollBy : undefined,
      columns: changedColumns.length > 0 ? changedColumns : undefined,
    })
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
    reports: {
      ...DEFAULT_SETTINGS.reports,
      ...input.values.reports,
      reportKey: String(input.values.reports.reportKey ?? ""),
      selectedActivityCodes: Array.isArray(input.values.reports.selectedActivityCodes)
        ? input.values.reports.selectedActivityCodes.map(String)
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
      }
    },
  })
}
