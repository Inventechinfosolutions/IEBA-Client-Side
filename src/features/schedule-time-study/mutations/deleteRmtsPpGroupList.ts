import { useMutation } from "@tanstack/react-query"

import { queryClient } from "@/main"

import { deleteRmtsPpGroupList } from "../api/api"
import { scheduleTimeStudyKeys } from "../keys"

export function useDeleteRmtsPpGroupList() {
  return useMutation({
    mutationFn: (id: number) => deleteRmtsPpGroupList(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleTimeStudyKeys.ppGroupList() })
      void queryClient.invalidateQueries({ queryKey: scheduleTimeStudyKeys.groups() })
    },
  })
}

