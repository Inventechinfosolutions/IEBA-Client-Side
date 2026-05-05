import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiSaveNotes } from "../api/personalTimeStudyApi"
import { personalTimeStudyKeys } from "../keys"

/**
 * Mutation to save notes for a specific date.
 */
export function useSavePersonalNotes(userId: string, dateStr: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notes: string) => apiSaveNotes({ date: dateStr, notes }),
    onSuccess: () => {
      toast.success("Notes saved")
      queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.dayDetail(userId, dateStr) })
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save notes")
    },
  })
}
