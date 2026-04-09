import { useMutation } from "@tanstack/react-query"

import { queryClient } from "@/main"

import { updateRmtsPayPeriod } from "../api/api"
import { matchPayPeriodListQueries } from "../keys"
import type { UpdateRmtsPayPeriodPayload } from "../types"

export function useUpdateRmtsPayPeriod() {
  return useMutation({
    mutationFn: (vars: { id: number; body: UpdateRmtsPayPeriodPayload }) =>
      updateRmtsPayPeriod(vars.id, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ predicate: matchPayPeriodListQueries })
    },
  })
}
