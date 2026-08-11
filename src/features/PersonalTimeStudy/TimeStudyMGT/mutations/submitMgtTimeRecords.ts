import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  apiSubmitTimeRecords,
  apiUpdateTimeRecord,
  apiUploadSupportingDoc,
  apiDeleteTimeRecord,
} from "../../api/personalTimeStudyApi"
import { timeStudyMGTKeys } from "../keys"
import { personalTimeStudyKeys } from "../../keys"
import { parkPersonalTimeStudyFocusSoon } from "../../utils/focusUtils"

function invalidateMgtQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  dateStr: string,
  month: number,
  year: number,
) {
  queryClient.invalidateQueries({ queryKey: timeStudyMGTKeys.dayDetail(userId, dateStr) })
  queryClient.invalidateQueries({ queryKey: timeStudyMGTKeys.monthLegend(userId, month, year) })
  queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.dayDetail(userId, dateStr) })
  queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.monthLegend(userId, month, year) })
  queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.timeEntrySummary(userId, dateStr) })
}

/**
 * Save / submit time records for a supervisee from Time Study MGT.
 */
export function useSubmitMgtTimeRecords(userId: string, dateStr: string, month: number, year: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ records, mode }: { records: any[]; mode: "save" | "submit" }) => {
      let results: any[]
      if (mode === "save" && records.length === 1 && records[0].id) {
        const parent = records[0]
        const { id, ...updatePayload } = parent
        results = [await apiUpdateTimeRecord(id, updatePayload)]
      } else {
        results = await apiSubmitTimeRecords(records, mode, "post")
      }

      for (let i = 0; i < records.length; i++) {
        const original = records[i]
        const saved = results[i]
        if (saved?.id && original.supportingDocs) {
          const pendingFiles = original.supportingDocs
            .filter((doc: any) => doc.file instanceof File)
            .map((doc: any) => doc.file)

          for (const file of pendingFiles) {
            await apiUploadSupportingDoc(saved.id, file as File)
          }
        }
      }

      return results
    },
    onSuccess: (_, { mode }) => {
      toast.success(`Records ${mode === "save" ? "saved" : "submitted"} successfully`)
      invalidateMgtQueries(queryClient, userId, dateStr, month, year)
      if (mode === "submit") {
        parkPersonalTimeStudyFocusSoon()
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to process records")
    },
  })
}

export function useDeleteMgtTimeRecord(userId: string, dateStr: string, month: number, year: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiDeleteTimeRecord(id),
    onSuccess: () => {
      toast.success("Entry deleted")
      invalidateMgtQueries(queryClient, userId, dateStr, month, year)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete entry")
    },
  })
}
