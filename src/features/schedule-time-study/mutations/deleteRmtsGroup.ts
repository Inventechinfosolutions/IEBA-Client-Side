import { useMutation } from "@tanstack/react-query"

import { queryClient } from "@/main"

import { deleteRmtsGroup } from "../api/api"
import { scheduleTimeStudyKeys } from "../keys"

export function useDeleteRmtsGroup() {
  return useMutation({
    mutationFn: (id: number) => deleteRmtsGroup(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleTimeStudyKeys.groups() })
      void queryClient.invalidateQueries({ queryKey: scheduleTimeStudyKeys.ppGroupList() })
    },
  })
}
