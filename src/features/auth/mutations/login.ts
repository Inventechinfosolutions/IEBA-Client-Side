import { useMutation } from "@tanstack/react-query"

import { authKeys } from "../keys"
import { login } from "../api/login"
import type { LoginCredentials, LoginResult } from "../types"

export function useLogin() {
  return useMutation<LoginResult, Error, LoginCredentials>({
    mutationKey: authKeys.login(),
    mutationFn: login,
  })
}
