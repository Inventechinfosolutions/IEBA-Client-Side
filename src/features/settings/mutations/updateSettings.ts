import { useMutation, useQueryClient } from "@tanstack/react-query"

import { settingsKeys } from "@/features/settings/keys"
import { delay, getMockSettings, MOCK_NETWORK_DELAY_MS, setMockSettings } from "@/features/settings/mock"
import { SettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import type { SettingsModel, UpdateSettingsInput } from "@/features/settings/types"
import type { PayrollBy, PayrollColumnSettingModel } from "@/features/settings/components/Payroll/types"
import {
  createCountyLocation,
  deleteCountyLocation,
  updateCountyClient,
  updateCountyLocation,
} from "@/features/settings/components/Country/api"
import { parseLocationId } from "@/features/settings/components/Country/locationUtils"
import {
  fetchCountyClientById,
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
    .map((row, idx) => ({
      locationId: parseLocationId(row.locationId),
      name: (row.location ?? "").trim(),
      street: (row.street ?? "").trim() || undefined,
      city: (row.city ?? "").trim() || undefined,
      state: (row.state ?? "").trim() || undefined,
      zip: (row.zip ?? "").trim() || undefined,
      primary: idx === 0,
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

  const freshClient = await fetchCountyClientById(clientId)

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

  // Upsert + delete locations (addresses) via Location API.
  const desired = normalizeCountyLocations(input.values)
  const existing = (freshClient.locations ?? []).slice().sort((a, b) => a.id - b.id)
  const existingIds = new Set(existing.map((l) => l.id))
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
      await updateCountyLocation(row.locationId, payload)
    } else {
      await createCountyLocation(payload)
    }
  }
}

async function updateSettings(
  queryClient: ReturnType<typeof useQueryClient>,
  input: UpdateSettingsInput,
): Promise<SettingsModel> {
  await delay(MOCK_NETWORK_DELAY_MS)

  if (input.submitterSection === SettingsFormSaveSection.County) {
    await saveCountyToBackend(queryClient, input)
  }

  const current = getMockSettings()
  const normalizedAddresses = (input.values.county.addresses ?? []).map((row) => ({
    locationId: parseLocationId(row.locationId),
    location: row.location ?? "",
    street: row.street ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    zip: row.zip ?? "",
  }))
  const next: SettingsModel = {
    version: current.version + 1,
    county: {
      ...current.county,
      ...input.values.county,
      logoDataUrl: input.values.county.logoDataUrl ?? null,
      welcomeMessage: input.values.county.welcomeMessage ?? "",
      isTimeRangeEnabled: Boolean(input.values.county.isTimeRangeEnabled),
      addresses: normalizedAddresses,
    },
    general: {
      ...current.general,
      ...input.values.general,
      screenInactivityTimeMinutes: Number(input.values.general.screenInactivityTimeMinutes),
    },
    reports: {
      ...current.reports,
      ...input.values.reports,
      reportKey: String(input.values.reports.reportKey ?? ""),
      selectedActivityCodes: Array.isArray(input.values.reports.selectedActivityCodes)
        ? input.values.reports.selectedActivityCodes.map(String)
        : [],
    },
    login: {
      ...current.login,
      ...input.values.login,
      otpValidationTimerSeconds: Number(input.values.login.otpValidationTimerSeconds),
    },
    fiscalYear: {
      fiscalYearStartMonth: "",
      fiscalYearEndMonth: "",
      year: "",
      appliedYearRanges: [],
      holidays: [],
    },
    payroll: {
      ...current.payroll,
      ...input.values.payroll,
      payrollBy: String(input.values.payroll?.payrollBy ?? "Weekly") as PayrollBy,
      columns: Array.isArray(input.values.payroll?.columns)
        ? input.values.payroll.columns.map((row) => {
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

  setMockSettings(next)
  return next
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => updateSettings(queryClient, input),
    onSuccess: (_data, variables) => {
      // Do not use `settingsKeys.all` (["settings"]) here: partial matching would also
      // invalidate the county-client query, then the line below would invalidate it again → duplicate fetches.
      void queryClient.invalidateQueries({ queryKey: settingsKeys.detail() })
      if (variables.submitterSection === SettingsFormSaveSection.County) {
        void queryClient.invalidateQueries({ queryKey: settingsCountyClientQueryKey })
      }
    },
  })
}

