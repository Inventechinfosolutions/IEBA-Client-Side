import { useMemo } from "react"
import { useGetScheduleTimeStudyPeriods } from "../queries/getScheduleTimeStudyPeriods"

export function useScheduleTimeStudyPeriods(department: string) {
  const query = useGetScheduleTimeStudyPeriods(department)

  const rows = useMemo(() => query.data ?? [], [query.data])

  return {
    rows,
    isLoading: query.isLoading,
  }
}
