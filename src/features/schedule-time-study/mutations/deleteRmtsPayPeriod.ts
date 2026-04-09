import { useMutation } from "@tanstack/react-query"

import { queryClient } from "@/main"

import { deleteRmtsPayPeriod } from "../api/api"
import { matchPayPeriodListQueries, scheduleTimeStudyKeys } from "../keys"
import type { ScheduleTimeStudyPeriodRow } from "../types"

export function useDeleteRmtsPayPeriod() {
  return useMutation({
    mutationFn: (id: number) => deleteRmtsPayPeriod(id),
    onSuccess: (_void, deletedId) => {
      queryClient.setQueriesData<ScheduleTimeStudyPeriodRow[]>(
        { predicate: matchPayPeriodListQueries },
        (old) =>
          Array.isArray(old)
            ? old.filter((row) => String(row.id) !== String(deletedId))
            : old,
      )
      void queryClient.removeQueries({
        queryKey: scheduleTimeStudyKeys.payPeriodById(deletedId),
      })
      void queryClient.invalidateQueries({ queryKey: scheduleTimeStudyKeys.ppGroupList() })
    },
  })
}
