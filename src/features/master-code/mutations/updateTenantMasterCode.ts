import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"


import { apiUpdateTenantMasterCode } from "../api"
import { masterCodeKeys } from "../keys"

export function useUpdateTenantMasterCode() {

  return useMutation({
    mutationFn: apiUpdateTenantMasterCode,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...masterCodeKeys.all, "tenant-by-name"] })
    },
  })
}
