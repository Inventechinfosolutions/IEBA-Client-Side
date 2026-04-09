import { useMutation } from "@tanstack/react-query"

import { queryClient } from "@/main"

import { createRmtsGroup } from "../api/api"
import { scheduleTimeStudyKeys } from "../keys"
import type { CreateRmtsGroupPayload } from "../types"

export function useCreateRmtsGroup() {
  return useMutation({
    mutationFn: (body: CreateRmtsGroupPayload) => createRmtsGroup(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleTimeStudyKeys.groups() })
    },
  })
}
