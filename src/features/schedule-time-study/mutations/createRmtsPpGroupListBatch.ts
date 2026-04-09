import { useMutation } from "@tanstack/react-query"

import { queryClient } from "@/main"

import { createRmtsPpGroupListBatch } from "../api/api"
import { matchPayPeriodListQueries, scheduleTimeStudyKeys } from "../keys"
import type { CreateRmtsPpGroupListBatchPayload } from "../types"

export function useCreateRmtsPpGroupListBatch() {
  return useMutation({
    mutationFn: (body: CreateRmtsPpGroupListBatchPayload) => createRmtsPpGroupListBatch(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleTimeStudyKeys.ppGroupList() })
      void queryClient.invalidateQueries({ queryKey: scheduleTimeStudyKeys.groups() })
      void queryClient.invalidateQueries({ predicate: matchPayPeriodListQueries })
    },
  })
}
