import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiPutCountyActivity } from "../api/countyActivityApi"
import type { UpdateCountyActivityApiInput } from "../types"
import { countyActivityCodeKeys } from "../keys"

export function useUpdateCountyActivityCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateCountyActivityApiInput) => apiPutCountyActivity(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: countyActivityCodeKeys.activityDetail(input.id),
      })
    },
  })
}
