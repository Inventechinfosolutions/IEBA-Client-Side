import { useMutation, useQueryClient } from "@tanstack/react-query"

import { uploadProfileImage, type UploadProfileImageInput } from "../api"
import { profileKeys } from "../keys"

export function useUploadProfileImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [...profileKeys.all, "upload-profile-image"],
    mutationFn: (input: UploadProfileImageInput) => uploadProfileImage(input),
    onMutate: async (variables) => {
      const id = variables.userId.trim()
      if (!id) return
      queryClient.setQueryData(profileKeys.profileImage(id), variables.dataUrl)
    },
    onSuccess: (_data, variables) => {
      const id = variables.userId.trim()
      if (id) {
        void queryClient.invalidateQueries({ queryKey: profileKeys.profileImage(id) })
      }
    },
  })
}

