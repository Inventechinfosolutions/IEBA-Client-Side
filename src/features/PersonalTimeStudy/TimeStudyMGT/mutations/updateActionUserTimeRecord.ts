import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  apiMgtActionUserTimeRecord,
  apiMgtActionUserTimeRecordRanges,
} from "../api/timeStudyMGTApi"
import { toast } from "sonner"
import { timeStudyMGTKeys } from "../keys"
import { personalTimeStudyKeys } from "../../keys"

function getActionSuccessMessage(status: string) {
  if (status === "approved") return "Time Sheet Approved"
  if (status === "rejected") return "Time Sheet Rejected"
  if (status === "opened") return "Time Sheet Unlocked"
  if (status === "notify") return "Notification Sent"
  return "Action completed successfully"
}

function getActionErrorMessage(error: unknown) {
  const response = (error as { response?: { data?: { message?: unknown } } })?.response
  return typeof response?.data?.message === "string"
    ? response.data.message
    : "Failed to perform action"
}

export function useActionUserTimeRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiMgtActionUserTimeRecord,
    onSuccess: (_data, variables) => {
      toast.success(getActionSuccessMessage(variables.status))
      queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.all })
      queryClient.invalidateQueries({ queryKey: timeStudyMGTKeys.all })
    },
    onError: (error: unknown) => {
      toast.error(getActionErrorMessage(error))
    }
  })
}

export function useActionUserTimeRecordRanges() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiMgtActionUserTimeRecordRanges,
    onSuccess: (_data, variables) => {
      toast.success(getActionSuccessMessage(variables.status))
      queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.all })
      queryClient.invalidateQueries({ queryKey: timeStudyMGTKeys.all })
    },
    onError: (error: unknown) => {
      toast.error(getActionErrorMessage(error))
    },
  })
}
