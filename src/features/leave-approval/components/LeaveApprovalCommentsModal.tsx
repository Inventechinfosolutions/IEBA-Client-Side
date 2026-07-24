import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import type { LeaveApprovalCommentsModalProps, LeaveApprovalCommentsModalValues } from "../types"

const commentsSchema = z.object({
  commentText: z.string().trim().max(500).optional(),
})

export function LeaveApprovalCommentsModal({
  open,
  title = "Comments",
  mode = "comments",
  initialValues,
  isSubmitting = false,
  onOpenChange,
  onSave,
}: LeaveApprovalCommentsModalProps) {
  const form = useForm<LeaveApprovalCommentsModalValues>({
    resolver: zodResolver(commentsSchema),
    defaultValues: initialValues,
  })

  const handleCommentSubmit = form.handleSubmit((values) => onSave(values, "comment"))
  const handleApprove = form.handleSubmit((values) => onSave(values, "approve"))
  const handleReject = form.handleSubmit((values) => onSave(values, "reject"))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        overlayClassName="bg-black/30"
        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[calc(100vw-24px)] sm:max-w-[560px] rounded-[6px] border border-[#e6e8ef] bg-white p-4 sm:p-6 text-[14px]"
      >
        {isSubmitting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60">
            <Spinner className="text-[#6C5DD3]" />
          </div>
        )}
        <DialogHeader className="space-y-0">
          <DialogTitle className="text-left !text-[14px] font-semibold leading-normal tracking-normal text-[#111827]">
            {title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCommentSubmit} className="mt-4">
          <Textarea
            {...form.register("commentText")}
            placeholder=""
            className="ieba-textarea-scroll h-[120px] max-h-[120px] resize-none overflow-y-auto whitespace-pre-wrap break-all rounded-[6px] border border-[#d6d7dc] bg-white px-3 py-2 text-[12px] text-[#111827] shadow-none focus-visible:border-[#6C5DD3] focus-visible:ring-0"
          />

          <div className="mt-5 flex flex-row items-center justify-end gap-2 sm:gap-3">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-[38px] sm:h-[44px] min-w-[70px] sm:min-w-[96px] cursor-pointer rounded-[6px] bg-[#d9d9d9] px-4 sm:px-6 !text-[12px] font-medium text-[#111827] hover:bg-[#d9d9d9]"
            >
              Cancel
            </Button>
            {mode === "requested" ? (
              <>
                <Button
                  type="button"
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="h-[38px] sm:h-[44px] min-w-[70px] sm:min-w-[96px] cursor-pointer rounded-[6px] bg-[#ef4444] px-4 sm:px-6 !text-[12px] font-medium text-white hover:bg-[#ef4444]"
                >
                  Reject
                </Button>
                <Button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="h-[38px] sm:h-[44px] min-w-[70px] sm:min-w-[96px] cursor-pointer rounded-[6px] bg-[#22c55e] px-4 sm:px-6 !text-[12px] font-medium text-white hover:bg-[#22c55e]"
                >
                  Approve
                </Button>
              </>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-[38px] sm:h-[44px] min-w-[70px] sm:min-w-[84px] cursor-pointer rounded-[6px] bg-[var(--primary)] px-5 sm:px-7 !text-[12px] font-medium text-white hover:bg-[var(--primary)]"
              >
                OK
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


