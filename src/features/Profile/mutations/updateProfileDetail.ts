import { useMutation, useQueryClient } from "@tanstack/react-query"

import { saveProfileDetail } from "../api"
import { profileKeys } from "../keys"
import type { UpdateProfileDetailInput } from "../types"

export function useUpdateProfileDetail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [...profileKeys.all, "update"],
    mutationFn: (input: UpdateProfileDetailInput) => saveProfileDetail(input),
    onSuccess: (data, variables) => {
      const uid = variables.id.trim()
      if (uid) {
        queryClient.setQueryData(profileKeys.detail(uid), data)
      }
    },
  })
}
