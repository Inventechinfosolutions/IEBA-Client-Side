import { useMutation } from "@tanstack/react-query"

import { queryClient } from "@/main"

import { createRmtsPayPeriod } from "../api/api"
import { matchPayPeriodListQueries } from "../keys"
import type { CreateRmtsPayPeriodPayload } from "../types"

export function useCreateRmtsPayPeriod() {
  return useMutation({
    mutationFn: (body: CreateRmtsPayPeriodPayload) => createRmtsPayPeriod(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ predicate: matchPayPeriodListQueries })
    },
  })
}
