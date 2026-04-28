import { useMutation } from "@tanstack/react-query"
import { apiMgtActionUserTimeRecord } from "../api/timeStudyMGTApi"
import { toast } from "sonner"

export function useActionUserTimeRecord() {
  return useMutation({
    mutationFn: apiMgtActionUserTimeRecord,
    onSuccess: () => {
      toast.success("User Notification sent")
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to send notification")
    }
  })
}
