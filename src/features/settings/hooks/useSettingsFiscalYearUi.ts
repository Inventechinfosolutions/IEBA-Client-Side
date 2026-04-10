import { useContext } from "react"

import type { SettingsFiscalYearUiValue } from "@/features/settings/components/FiscalYear/types"
import { SettingsFiscalYearUiContext } from "@/features/settings/context/settingsFiscalYearUiContext"

export function useSettingsFiscalYearUi(): SettingsFiscalYearUiValue {
  const ctx = useContext(SettingsFiscalYearUiContext)
  if (!ctx) {
    throw new Error("useSettingsFiscalYearUi must be used within SettingsFiscalYearUiProvider")
  }
  return ctx
}
