import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiMgtActionUserTimeRecord } from "../api/timeStudyMGTApi"
import { toast } from "sonner"
import { timeStudyMGTKeys } from "../keys"
import { personalTimeStudyKeys } from "../../keys"

export function useActionUserTimeRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiMgtActionUserTimeRecord,
    onSuccess: (_data, variables) => {
      const s = variables.status
      let msg = "Action completed successfully"
      if (s === "approved") msg = "Time Sheet Approved"
      if (s === "rejected") msg = "Time Sheet Rejected"
      if (s === "opened") msg = "Time Sheet Unlocked"
      if (s === "notify") msg = "Notification Sent"
      
      toast.success(msg)
      queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.all })
      queryClient.invalidateQueries({ queryKey: timeStudyMGTKeys.all })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to perform action")
    }
  })
}
