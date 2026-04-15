import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteProfileImage } from "../api"
import { profileKeys } from "../keys"

export function useDeleteProfileImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [...profileKeys.all, "delete-profile-image"],
    mutationFn: (userId: string) => deleteProfileImage(userId),
    onSuccess: (_data, userId) => {
      const id = userId.trim()
      if (!id) return
      queryClient.setQueryData(profileKeys.profileImage(id), null)
    },
  })
}

