import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiPutCountyActivity } from "../api/countyActivityApi"
import type { UpdateCountyActivityApiInput } from "../types"

import { applyCountyActivityQueryCacheAfterUpdate } from "./countyActivityQueryCache"

export function useUpdateCountyActivityCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateCountyActivityApiInput) => apiPutCountyActivity(input),
    onSuccess: (_data, input) => {
      applyCountyActivityQueryCacheAfterUpdate(queryClient, input)
    },
  })
}
