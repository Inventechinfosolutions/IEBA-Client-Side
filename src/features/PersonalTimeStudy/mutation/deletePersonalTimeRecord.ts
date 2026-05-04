import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiDeleteTimeRecord } from "../api/personalTimeStudyApi"
import { personalTimeStudyKeys } from "../keys"

/**
 * Mutation to delete a time record.
 */
export function useDeletePersonalTimeRecord(userId: string, dateStr: string, month: number, year: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiDeleteTimeRecord(id),
    onSuccess: () => {
      toast.success("Entry deleted")
      queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.dayDetail(userId, dateStr) })
      queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.monthLegend(userId, month, year) })
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete entry")
    },
  })
}
