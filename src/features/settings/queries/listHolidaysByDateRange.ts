import { useQuery } from "@tanstack/react-query"

import { normalizeFiscalDateToIso } from "@/features/settings/components/FiscalYear/fiscalYearDateUtils"
import type {
  ListHolidaysByDateRangeParams,
  SettingsHolidayCalendarRow,
} from "@/features/settings/components/FiscalYear/types"
import { settingsKeys } from "@/features/settings/keys"
import { fetchHolidayListByDateRange } from "@/features/schedule-time-study/api/api"

export type { ListHolidaysByDateRangeParams }

function mapToSettingsRow(row: {
  id: number
  date: string
  description: string
  optional: boolean
}): SettingsHolidayCalendarRow | null {
  const iso = normalizeFiscalDateToIso(row.date)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  return {
    id: row.id,
    dateIso: iso,
    description: row.description,
    optional: row.optional,
  }
}

export async function fetchListHolidaysByDateRange(
  params: ListHolidaysByDateRangeParams,
): Promise<SettingsHolidayCalendarRow[]> {
  const list = await fetchHolidayListByDateRange(params.startmonth, params.endmonth)
  const out: SettingsHolidayCalendarRow[] = []
  for (const row of list) {
    const mapped = mapToSettingsRow(row)
    if (mapped) out.push(mapped)
  }
  return out
}

export function useListHolidaysByDateRange(params: ListHolidaysByDateRangeParams) {
  const start = params.startmonth.trim()
  const end = params.endmonth.trim()
  const enabled = params.enabled !== false && start.length > 0 && end.length > 0

  return useQuery({
    queryKey: settingsKeys.fiscalYear.holidaysByRange(start, end),
    queryFn: () => fetchListHolidaysByDateRange({ startmonth: start, endmonth: end }),
    enabled,
    staleTime: 15_000,
  })
}
