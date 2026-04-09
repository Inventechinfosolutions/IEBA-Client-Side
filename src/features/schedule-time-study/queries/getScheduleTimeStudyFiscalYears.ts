import { useQuery } from "@tanstack/react-query"

import { fetchScheduleTimeStudyFiscalYears } from "../api/api"
import { scheduleTimeStudyKeys } from "../keys"

export function useGetScheduleTimeStudyFiscalYears() {
  return useQuery({
    queryKey: scheduleTimeStudyKeys.fiscalYears(),
    queryFn: fetchScheduleTimeStudyFiscalYears,
    staleTime: 60_000,
  })
}
