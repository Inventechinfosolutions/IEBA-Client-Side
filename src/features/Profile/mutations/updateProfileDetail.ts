import { useMutation, useQueryClient } from "@tanstack/react-query"

import { profileKeys } from "../keys"
import { delay, MOCK_NETWORK_DELAY_MS, updateMockProfileDetail } from "../mock"
import type { ProfileDetailData, UpdateProfileDetailInput } from "../types"

async function updateProfileDetail(input: UpdateProfileDetailInput): Promise<ProfileDetailData> {
  if (import.meta.env.DEV) await delay(MOCK_NETWORK_DELAY_MS)
  return updateMockProfileDetail(input.values)
}

export function useUpdateProfileDetail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [...profileKeys.all, "update"],
    mutationFn: (input: UpdateProfileDetailInput) => updateProfileDetail(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() })
    },
  })
}

