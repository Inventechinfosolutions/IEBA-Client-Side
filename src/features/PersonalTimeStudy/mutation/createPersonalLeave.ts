import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiSaveLeaveAsDraft, apiSubmitLeaveAsRequested, apiWithdrawLeave, apiUpdateUserLeave } from "../api/personalTimeStudyApi"
import { personalTimeStudyKeys } from "../keys"
import type { CreateLeavePayload } from "../types"

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>, userId: string, dateStr: string, month: number, year: number) {
  queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.dayDetail(userId, dateStr) })
  queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.monthLegend(userId, month, year) })
  queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.timeEntrySummary(userId, dateStr) })
}

/** Save leave entries as draft (no supervisor notification). */
export function useCreatePersonalLeave(userId: string, dateStr: string, month: number, year: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ values, userId: uid, dropdownData }: CreateLeavePayload) =>
      apiSaveLeaveAsDraft(values, uid ?? userId, dropdownData),
    onSuccess: () => {
      toast.success("Leave request saved")
      invalidateAll(queryClient, userId, dateStr, month, year)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save leave request")
    },
  })
}

/** Submit leave entries as requested (notifies supervisor). */
export function useSubmitPersonalLeave(userId: string, dateStr: string, month: number, year: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ values, userId: uid, dropdownData }: CreateLeavePayload) =>
      apiSubmitLeaveAsRequested(values, uid ?? userId, dropdownData),
    onSuccess: () => {
      toast.success("Leave request submitted")
      invalidateAll(queryClient, userId, dateStr, month, year)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit leave request")
    },
  })
}

/** Update an existing leave request. */
export function useUpdatePersonalLeave(userId: string, dateStr: string, month: number, year: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values, userId: uid, status, dropdownData }: { id: number; status: "draft" | "requested" | "approved" } & CreateLeavePayload) =>
      apiUpdateUserLeave(id, values, uid ?? userId, status, dropdownData),
    onSuccess: () => {
      toast.success("Leave request updated")
      invalidateAll(queryClient, userId, dateStr, month, year)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update leave request")
    },
  })
}

/** Withdraw a leave request. */
export function useWithdrawPersonalLeave(userId: string, dateStr: string, month: number, year: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (leave: any) => apiWithdrawLeave(leave),
    onSuccess: () => {
      toast.success("Leave request withdrawn")
      invalidateAll(queryClient, userId, dateStr, month, year)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to withdraw leave request")
    },
  })
}
