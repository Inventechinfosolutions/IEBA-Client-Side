import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiSubmitTimeRecords, apiUpdateTimeRecord } from "../api/personalTimeStudyApi"
import { personalTimeStudyKeys } from "../keys"

/**
 * Mutation to save or submit time records.
 */
export function useSubmitPersonalTimeRecords(userId: string, dateStr: string, month: number, year: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ records, mode }: { records: any[]; mode: "save" | "submit" }) => {
      if (mode === "save" && records.length === 1 && records[0].id) {
        const parent = records[0]
        const { id, ...updatePayload } = parent
        return apiUpdateTimeRecord(id, updatePayload)
      }
      return apiSubmitTimeRecords(records, mode, "post")
    },
    onSuccess: (_, { mode }) => {
      toast.success(`Records ${mode === "save" ? "saved" : "submitted"} successfully`)
      queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.dayDetail(userId, dateStr) })
      queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.monthLegend(userId, month, year) })
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to process records")
    },
  })
}
