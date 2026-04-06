import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiPostCountyActivity } from "../api/countyActivityApi"
import type { CreateCountyActivityApiInput } from "../types"
import { countyActivityCodeKeys } from "../keys"

export function useCreateCountyActivityCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCountyActivityApiInput) => apiPostCountyActivity(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.lists() })
    },
  })
}
