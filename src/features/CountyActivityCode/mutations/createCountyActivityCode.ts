import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiPostCountyActivity } from "../api/countyActivityApi"
import { CountyActivityGridRowType } from "../enums/CountyActivity.enum"
import { countyActivityCodeKeys } from "../keys"
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
      } else {
        applyCountyActivityQueryCacheAfterSubCreate(queryClient, variables, data)
      }
      void queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.pagedLists() })
      if (variables.tab === CountyActivityGridRowType.SUB && variables.parentId) {
        void queryClient.invalidateQueries({
          queryKey: countyActivityCodeKeys.nestedActivities(variables.parentId),
        })
      }
    },
  })
}
