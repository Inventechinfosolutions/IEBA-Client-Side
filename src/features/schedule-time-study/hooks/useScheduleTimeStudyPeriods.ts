import { useMemo } from "react"

import { useGetRmtsPayPeriods } from "../queries/getRmtsPayPeriods"

export function useScheduleTimeStudyPeriods(
  departmentId: number | null,
  fiscalyear: string,
  enabled = true,
) {
  const query = useGetRmtsPayPeriods({ departmentId, fiscalyear, enabled })

  const rows = useMemo(() => query.data ?? [], [query.data])

  return {
    rows,
    isLoading: query.isLoading,
  }
}
