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
import type { LeaveApprovalCommentsModalProps, LeaveApprovalCommentsModalValues } from "../types"

const commentsSchema = z.object({
  commentText: z.string().trim().max(500).optional(),
})

export function LeaveApprovalCommentsModal({
  open,
  title = "Comments",
  initialValues,
  onOpenChange,
  onSave,
}: LeaveApprovalCommentsModalProps) {
  const form = useForm<LeaveApprovalCommentsModalValues>({
    resolver: zodResolver(commentsSchema),
    defaultValues: initialValues,
  })

  const handleSubmit = form.handleSubmit((values) => onSave(values))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        overlayClassName="bg-black/30"
        className="top-[24%] max-w-[560px] rounded-[6px] border border-[#e6e8ef] bg-white p-6 text-[14px]"
      >
        <DialogHeader className="space-y-0">
          <DialogTitle className="text-left !text-[14px] font-semibold leading-normal tracking-normal text-[#111827]">
            {title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4">
          <Textarea
            {...form.register("commentText")}
            placeholder=""
            className="ieba-textarea-scroll h-[120px] max-h-[120px] resize-none overflow-y-auto whitespace-pre-wrap break-all rounded-[6px] border border-[#d6d7dc] bg-white px-3 py-2 text-[12px] text-[#111827] shadow-none focus-visible:border-[#cfc6ff] focus-visible:ring-0"
          />

          <DialogFooter className="mt-5 flex justify-end gap-3 sm:justify-end">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-[44px] min-w-[96px] cursor-pointer rounded-[6px] bg-[#d9d9d9] px-6 !text-[12px] font-medium text-[#111827] hover:bg-[#d9d9d9]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-[44px] min-w-[84px] cursor-pointer rounded-[6px] bg-[var(--primary)] px-7 !text-[12px] font-medium text-white hover:bg-[var(--primary)]"
            >
              OK
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

