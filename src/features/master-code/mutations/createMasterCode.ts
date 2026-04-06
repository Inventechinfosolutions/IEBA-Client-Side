import { useMutation, useQueryClient } from "@tanstack/react-query"

import { countyActivityCodeKeys } from "@/features/CountyActivityCode/keys"

import { apiCreateActivityCode } from "../api"
import { masterCodeKeys } from "../keys"
import type { CreateMasterCodeInput } from "../types"

export function useCreateMasterCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateMasterCodeInput) => apiCreateActivityCode(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterCodeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: masterCodeKeys.activityCodesCatalogEnrichment() })
      queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.lists() })
    },
  })
}
