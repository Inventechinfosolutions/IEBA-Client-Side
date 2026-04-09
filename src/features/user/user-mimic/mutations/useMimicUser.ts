import { useMutation } from "@tanstack/react-query"

import { apiMimicUser } from "../api"
import type { MimicUserBody, MimicUserResult } from "../types"

export function useMimicUser() {
  return useMutation<MimicUserResult, Error, MimicUserBody>({
    mutationFn: async (body) => await apiMimicUser(body),
  })
}

