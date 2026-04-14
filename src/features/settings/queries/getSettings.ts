import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { settingsKeys } from "@/features/settings/keys"
import { DEFAULT_SETTINGS } from "@/features/settings/constants"
import type { SettingsResponse } from "@/features/settings/types"
import { getPayrollSettings } from "../payroll/api/payrollApi"

// General settings fetch — does NOT include payroll
async function fetchSettings(): Promise<SettingsResponse> {
  return {
    ...DEFAULT_SETTINGS,
  }
}

// Payroll fetched independently with its own query key
async function fetchPayrollSettings() {
  return getPayrollSettings()
}

export function useGetSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: fetchSettings,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}

export function useGetPayrollSettings() {
  return useQuery({
    queryKey: settingsKeys.payroll.detail(),
    queryFn: fetchPayrollSettings,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}
