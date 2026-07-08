import { useMutation } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { changePasswordKeys } from "../keys"

async function dismissPasswordChange(): Promise<void> {
  await api.post<unknown>("/auth/dismiss-password-change")
}

export function useDismissPasswordChange() {
  return useMutation<void, Error, void>({
    mutationKey: [...changePasswordKeys.all, "dismiss"],
    mutationFn: dismissPasswordChange,
  })
}
