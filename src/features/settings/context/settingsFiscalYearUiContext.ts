import { createContext } from "react"

import type { SettingsFiscalYearUiValue } from "@/features/settings/components/FiscalYear/types"

export const SettingsFiscalYearUiContext = createContext<SettingsFiscalYearUiValue | null>(null)
