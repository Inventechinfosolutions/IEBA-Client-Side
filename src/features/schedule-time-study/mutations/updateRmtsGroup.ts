import { useMutation } from "@tanstack/react-query"

import { queryClient } from "@/main"

import { updateRmtsGroup } from "../api/api"
import { scheduleTimeStudyKeys } from "../keys"
import type { UpdateRmtsGroupPayload } from "../types"

export function useUpdateRmtsGroup() {
  return useMutation({
    mutationFn: (vars: { id: number; body: UpdateRmtsGroupPayload }) =>
      updateRmtsGroup(vars.id, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleTimeStudyKeys.groups() })
    },
  })
}
