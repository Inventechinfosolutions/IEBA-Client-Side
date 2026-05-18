import { useQuery } from "@tanstack/react-query"

import { fetchScheduleTimeStudyFiscalYears } from "../api/api"
import { scheduleTimeStudyKeys } from "../keys"

export function useGetScheduleTimeStudyFiscalYears(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: scheduleTimeStudyKeys.fiscalYears(),
    queryFn: fetchScheduleTimeStudyFiscalYears,
    staleTime: 60_000,
    enabled: options?.enabled,
  })
}
