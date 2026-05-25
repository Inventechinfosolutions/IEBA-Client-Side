import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiPutCountyActivity } from "../api/countyActivityApi"
import { CountyActivityGridRowType } from "../enums/CountyActivity.enum"
import type { UpdateCountyActivityApiInput } from "../types"

import { countyActivityCodeKeys } from "../keys"
import { applyCountyActivityQueryCacheAfterUpdate } from "./countyActivityQueryCache"

export function useUpdateCountyActivityCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateCountyActivityApiInput) => apiPutCountyActivity(input),
    onSuccess: (_data, input) => {
      if (input.rowType === CountyActivityGridRowType.SUB && input.parentId) {
        void queryClient.invalidateQueries({
          queryKey: countyActivityCodeKeys.nestedActivities(input.parentId),
        })
      }
    },
  })
}
