import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiPostCountyActivity } from "../api/countyActivityApi"
import { CountyActivityGridRowType } from "../enums/CountyActivity.enum"
import type { CreateCountyActivityApiInput } from "../types"

import {
  applyCountyActivityQueryCacheAfterPrimaryCreate,
  applyCountyActivityQueryCacheAfterSubCreate,
} from "./countyActivityQueryCache"

export function useCreateCountyActivityCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCountyActivityApiInput) => apiPostCountyActivity(input),
    onSuccess: (data, variables) => {
      if (variables.tab === CountyActivityGridRowType.PRIMARY) {
        applyCountyActivityQueryCacheAfterPrimaryCreate(queryClient, variables, data)
        return
      }
      applyCountyActivityQueryCacheAfterSubCreate(queryClient, variables, data)
    },
  })
}
