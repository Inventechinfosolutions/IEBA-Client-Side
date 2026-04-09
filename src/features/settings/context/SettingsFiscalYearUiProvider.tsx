import type { ReactNode } from "react"

import type { SettingsFiscalYearUiValue } from "@/features/settings/components/FiscalYear/types"

import { SettingsFiscalYearUiContext } from "@/features/settings/context/settingsFiscalYearUiContext"

export function SettingsFiscalYearUiProvider({
  value,
  children,
}: {
  value: SettingsFiscalYearUiValue
  children: ReactNode
}) {
  return (
    <SettingsFiscalYearUiContext.Provider value={value}>
      {children}
    </SettingsFiscalYearUiContext.Provider>
  )
}
