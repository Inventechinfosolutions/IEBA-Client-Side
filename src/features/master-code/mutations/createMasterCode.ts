import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"

import { countyActivityCodeKeys } from "@/features/CountyActivityCode/keys"

import { apiCreateActivityCode } from "../api"

import { apiCreateMasterCode } from "../api"
import { masterCodeKeys } from "../keys"
import type { CreateMasterCodeInput } from "../types"

export function useCreateMasterCode() {

  return useMutation({
    mutationFn: (input: CreateMasterCodeInput) => apiCreateActivityCode(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterCodeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: masterCodeKeys.activityCodesCatalogEnrichment() })
      queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.lists() })
    mutationFn: async (input: CreateMasterCodeInput) => await apiCreateMasterCode(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: masterCodeKeys.lists() })
    },
  })
}
