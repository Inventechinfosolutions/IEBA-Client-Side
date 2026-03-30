import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TodoStatusEnum } from "../enums/todo-status.enum"
import { todoFormSchema } from "../schemas"
import { TODO_STATUS_LABEL, TODO_STATUS_OPTIONS } from "../types"
import type { TodoFormValues, TodoFormModalProps } from "../types"

export function TodoFormModal({
  open,
  mode,
  initialValues,
  isSubmitting = false,
  onOpenChange,
  onSave,
}: TodoFormModalProps) {
  const isEditMode = mode === "edit"
  const isNewStatusDisabled = isEditMode && initialValues.status !== TodoStatusEnum.NEW

  const form = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: initialValues,
  })

  const selectedStatus = form.watch("status")
  const isDescriptionDisabled = isEditMode && selectedStatus === TodoStatusEnum.COMPLETED

  const handleSubmit = form.handleSubmit((values) => {
    onSave(values)
  }, () => {
    const titleError = form.formState.errors.title?.message
    const descriptionError = form.formState.errors.description?.message
    const statusError = form.formState.errors.status?.message
    const message = titleError || descriptionError || statusError || "Please fix validation errors"

    toast.error(message, {
      position: "top-center",
      icon: (
        <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#ef4444] text-white">
          <X className="size-3 stroke-[3]" />
        </span>
      ),
      className:
        "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !px-3 !py-2 !text-[12px] !whitespace-nowrap !text-[#111827] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        overlayClassName="bg-black/55"
        className="w-full max-w-[800px] rounded-[4px] border border-[#e2e5ee] p-0 translate-y-[-80%] shadow-[0_12px_28px_rgba(17,24,39,0.16)]"
      >
        <DialogHeader className="px-8 pb-2 pt-6">
          <DialogTitle className="text-center text-[24px] font-medium text-[#111827]">
            {mode === "edit" ? "Edit To Do" : "Add To Do"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-12 pb-12 pt-1">
          <input type="hidden" {...form.register("status")} />
          <div className="space-y-8">
            {isEditMode ? (
              <div className="grid grid-cols-[minmax(0,1fr)_270px] items-start gap-10">
                <div>
                  <label className="mb-1 block text-[12px] text-[#111827]">
                    *Title
                  </label>
                  <Input
                    {...form.register("title")}
                    disabled={isEditMode}
                    placeholder="Enter To Do Title"
                    className="h-[46px] w-[300px] rounded-[8px] border-[#dfe3ee] text-[12px] placeholder:text-[12px] placeholder:text-gray-400 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100 focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] text-[#111827]">*Status</label>
                  <div className="flex h-[46px] items-center gap-4">
                    {TODO_STATUS_OPTIONS.map((statusOption) => {
                      const isDisabledOption =
                        statusOption === "new" && isNewStatusDisabled

                      return (
                      <label
                        key={statusOption}
                        className={`inline-flex items-center gap-2 text-[12px] ${
                          isDisabledOption
                            ? "cursor-not-allowed text-[#b8bec9]"
                            : "cursor-pointer text-[#111827]"
                        }`}
                      >
                        <input
                          type="radio"
                          value={statusOption}
                          checked={selectedStatus === statusOption}
                          disabled={isDisabledOption}
                          onChange={() => {
                            if (isDisabledOption) return
                            form.setValue("status", statusOption, { shouldValidate: true })
                          }}
                          className="sr-only"
                        />
                        <span
                          className={`inline-flex size-[16px] items-center justify-center rounded-full ${
                            isDisabledOption
                              ? "border-[8px] border-[#d7dbe4]"
                              : selectedStatus === statusOption
                                ? "border-[5px] border-[#6c5dd3]"
                                : "border-[2px] border-[#c9ced9]"
                          }`}
                          aria-hidden="true"
                        />
                        <span>{TODO_STATUS_LABEL[statusOption]}</span>
                      </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-[12px] text-[#111827]">
                  *Title
                </label>
                <Input
                  {...form.register("title")}
                  placeholder="Enter To Do Title"
                  className="h-[46px] w-[282px] rounded-[8px] border-[#dfe3ee] text-[12px] placeholder:text-[12px] placeholder:text-gray-400 focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-[12px] text-[#111827]">
                *Description
              </label>
              <Textarea
                {...form.register("description")}
                disabled={isDescriptionDisabled}
                placeholder="Enter To Do Description"
                className="min-h-[86px] whitespace-pre-wrap break-all rounded-[8px] border-[#dfe3ee] text-[12px] placeholder:text-[12px] placeholder:text-gray-400 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100 focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
            </div>
          </div>
          <div className="mt-8 flex items-center justify-end gap-5">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-[52px] min-w-[98px] cursor-pointer rounded-[10px] bg-[#6C5DD3] px-7 text-[14px] text-white hover:bg-[#6C5DD3]"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-[52px] min-w-[98px] cursor-pointer rounded-[10px] bg-[#d2d4d9] px-7 text-[14px] text-[#111827] hover:bg-[#d2d4d9]"
            >
              Exit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

