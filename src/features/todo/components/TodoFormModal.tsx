import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { guardNoChanges } from "@/lib/formGuard"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { Textarea } from "@/components/ui/textarea"
import { TodoStatusEnum } from "../enums/todoStatus"
import { todoFormSchema } from "../schemas"
import { useGetTodoById } from "../queries/getTodos"
import { TODO_STATUS_LABEL, TODO_STATUS_OPTIONS } from "../types"
import type { TodoFormValues, TodoFormModalProps, TodoRow } from "../types"

/**
 * Picks only the fields the form cares about from a TodoRow (API response).
 * Needed because apiGetTodoById returns a full TodoRow (id, createdDate, etc.)
 * but the form only tracks { title, description, status }.
 * Without this, the guard's deep-equal comparison would always fail (shape mismatch).
 */
function serverDataToFormValues(row: TodoRow): TodoFormValues {
  return {
    title: row.title,
    description: row.description,
    status: row.status,
  }
}

export function TodoFormModal({
  open,
  mode,
  todoId,
  initialValues,
  isSubmitting = false,
  onOpenChange,
  onSave,
}: TodoFormModalProps) {
  const isEditMode = mode === "edit"
  
  const { data: serverData, isLoading: isFetching } = useGetTodoById(
    isEditMode ? todoId : undefined
  )

  // Derive a clean TodoFormValues from serverData (which is a full TodoRow).
  // This ensures the form and the guard always work with the same shape.
  const formSnapshot: TodoFormValues | undefined = serverData
    ? serverDataToFormValues(serverData)
    : undefined

  const isNewStatusDisabled = isEditMode && initialValues.status !== TodoStatusEnum.NEW

  const form = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    values: formSnapshot ?? initialValues,
  })

  const selectedStatus = form.watch("status")
  const isDescriptionDisabled = isEditMode && selectedStatus === TodoStatusEnum.COMPLETED

  const handleSubmit = form.handleSubmit((values) => {
    // Guard: block save if nothing has changed.
    // Edit mode  → compare against clean form-shaped API snapshot (formSnapshot).
    // Create mode → compare against the empty initialValues passed as prop.
    const reference = formSnapshot ?? initialValues
    if (guardNoChanges(values, reference)) return

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
          <Check className="size-3 stroke-3" />
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
        className="w-[calc(100%-2rem)] sm:w-full max-w-[800px] rounded-[4px] border border-[#e2e5ee] p-0 translate-y-[-50%] md:translate-y-[-80%] shadow-[0_12px_28px_rgba(17,24,39,0.16)]"
      >
        <DialogHeader className="px-8 pb-2 pt-6">
          <DialogTitle className="text-center text-[24px] font-medium text-[#111827]">
            {mode === "edit" ? "Edit To Do" : "Add To Do"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="relative px-6 sm:px-12 pb-6 sm:pb-12 pt-1">
          {isSubmitting && (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-b-[4px] bg-white/60">
              <Spinner className="text-[#6C5DD3]" />
            </div>
          )}
          <TitleCaseInput type="hidden" {...form.register("status")} />
          
          {isEditMode && isFetching && !serverData ? (
            <div className="flex h-[300px] items-center justify-center">
              <Spinner className="text-[#6C5DD3]" />
            </div>
          ) : (
            <>
              <div className="space-y-8">
                {isEditMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_270px] items-start gap-6 md:gap-10">
                    <div>
                      <label className="mb-1 block text-[12px] text-[#111827]">
                        *Title
                      </label>
                      <TitleCaseInput
                        {...form.register("title")}
                        disabled={isEditMode}
                        placeholder="Enter To Do Title"
                        className="h-[46px] w-full md:w-[300px] rounded-[8px] border-[#dfe3ee] text-[12px] placeholder:text-[12px] placeholder:text-gray-400 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:border-[0.8px]! disabled:border-[#cfd4dd]! disabled:bg-[#d2d4d9]/20! disabled:text-black! disabled:opacity-100 focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[12px] text-[#111827]">*Status</label>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 h-auto py-2 md:h-[46px] md:py-0">
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
                            <TitleCaseInput
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
                                  ? "border-8 border-[#d7dbe4]"
                                  : selectedStatus === statusOption
                                    ? "border-[5px] border-[#6c5dd3]"
                                    : "border-2 border-[#c9ced9]"
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
                    <TitleCaseInput
                      {...form.register("title")}
                      placeholder="Enter To Do Title"
                      className="h-[46px] w-full md:w-[282px] rounded-[8px] border-[#dfe3ee] text-[12px] placeholder:text-[12px] placeholder:text-gray-400 focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
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
                    className="min-h-[86px] whitespace-pre-wrap break-all rounded-[8px] border-[#dfe3ee] text-[12px] placeholder:text-[12px] placeholder:text-gray-400 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:border-[0.8px]! disabled:border-[#cfd4dd]! disabled:bg-[#d2d4d9]/20! disabled:text-black! disabled:opacity-100 focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
                  />
                </div>
              </div>
              <div className="mt-8 flex items-center justify-end gap-5">
                <Button
                  type="submit"
                  disabled={isSubmitting || (isEditMode && isFetching)}
                  className="h-[52px] min-w-[98px] cursor-pointer rounded-[10px] bg-[#6C5DD3] px-7 text-[14px] text-white hover:bg-[#6C5DD3]"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="h-[52px] min-w-[98px] cursor-pointer rounded-[10px] bg-[#d2d4d9] px-7 text-[14px] text-[#111827] hover:bg-[#d2d4d9]"
                >
                  Exit
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

