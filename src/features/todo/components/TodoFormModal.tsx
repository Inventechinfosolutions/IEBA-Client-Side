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
        "!w-fit !max-w-[90vw] sm:!max-w-none !min-h-[35px] !rounded-[8px] !px-3 !py-2 !text-[12px] !whitespace-normal sm:!whitespace-nowrap !text-[#111827] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        overlayClassName="bg-black/55"
        className="w-full max-w-[800px] rounded-[4px] border border-[#e2e5ee] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-0 translate-y-[-50%] sm:translate-y-[-80%] [@media(max-height:700px)]:!translate-y-[-50%] max-h-[90dvh] overflow-hidden flex flex-col shadow-[0_12px_28px_rgba(17,24,39,0.16)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.6)]"
      >
        <DialogHeader className="px-5 pb-2 pt-5 sm:px-8 sm:pt-6">
          <DialogTitle className="text-center text-[20px] sm:text-[24px] font-medium text-[#111827] dark:text-white">
            {mode === "edit" ? "Edit To Do" : "Add To Do"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="relative flex flex-col flex-1 overflow-hidden px-5 pt-1 sm:px-12">
          {isSubmitting && (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-b-[4px] bg-white/60 dark:bg-black/60">
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
              {/* Scrollable fields area */}
              <div className="flex-1 overflow-y-auto">
              <div className="space-y-5 sm:space-y-8">
                {isEditMode ? (
                  <div className="flex flex-col gap-5 sm:grid sm:grid-cols-[minmax(0,1fr)_270px] sm:items-start sm:gap-10">
                    <div>
                      <label className="mb-1 block text-[12px] text-[#111827] dark:text-[#9ca3af]">
                        *Title
                      </label>
                      <TitleCaseInput
                        {...form.register("title")}
                        disabled={isEditMode}
                        placeholder="Enter To Do Title"
                        className="h-[46px] w-full sm:w-[300px] rounded-[8px] border-[#dfe3ee] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[12px] text-[#111827] dark:text-white placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-zinc-500 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:border-[0.8px]! disabled:border-[#cfd4dd]! dark:disabled:border-[#27272a]! disabled:bg-[#d2d4d9]/20! dark:disabled:bg-zinc-800/40! disabled:text-black! dark:disabled:text-zinc-400! disabled:opacity-100 focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[12px] text-[#111827] dark:text-[#9ca3af]">*Status</label>
                      <div className="flex flex-wrap h-auto sm:h-[46px] items-center gap-3 sm:gap-4">
                        {TODO_STATUS_OPTIONS.map((statusOption) => {
                          const isDisabledOption =
                            statusOption === "new" && isNewStatusDisabled

                          return (
                          <label
                            key={statusOption}
                            className={`inline-flex items-center gap-2 text-[12px] ${
                              isDisabledOption
                                ? "cursor-not-allowed text-[#b8bec9] dark:text-zinc-600"
                                : "cursor-pointer text-[#111827] dark:text-white"
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
                                  ? "border-8 border-[#d7dbe4] dark:border-zinc-800"
                                  : selectedStatus === statusOption
                                    ? "border-[5px] border-[#6c5dd3]"
                                    : "border-2 border-[#c9ced9] dark:border-zinc-700"
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
                    <label className="mb-1 block text-[12px] text-[#111827] dark:text-[#9ca3af]">
                      *Title
                    </label>
                    <TitleCaseInput
                      {...form.register("title")}
                      placeholder="Enter To Do Title"
                      className="h-[46px] w-full sm:w-[282px] rounded-[8px] border-[#dfe3ee] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[12px] text-[#111827] dark:text-white placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-[12px] text-[#111827] dark:text-[#9ca3af]">
                    *Description
                  </label>
                  <Textarea
                    {...form.register("description")}
                    disabled={isDescriptionDisabled}
                    placeholder="Enter To Do Description"
                    className="min-h-[86px] max-h-[104px] resize-none overflow-y-auto w-full whitespace-pre-wrap break-all rounded-[8px] border-[#dfe3ee] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[12px] text-[#111827] dark:text-white placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-zinc-500 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:border-[0.8px]! disabled:border-[#cfd4dd]! dark:disabled:border-[#27272a]! disabled:bg-[#d2d4d9]/20! dark:disabled:bg-zinc-800/40! disabled:text-black! dark:disabled:text-zinc-400! disabled:opacity-100 focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
                  />
                </div>
              </div>
              </div>{/* end scrollable */}
              <div className="px-0 pb-6 sm:pb-10 pt-4 sm:pt-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-5">
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="h-[46px] sm:h-[52px] w-full sm:w-auto sm:min-w-[98px] cursor-pointer rounded-[10px] bg-[#d2d4d9] dark:bg-[#27272a] px-7 text-[14px] text-[#111827] dark:text-white hover:bg-[#c4c6ce] dark:hover:bg-[#3f3f46]"
                >
                  Exit
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || (isEditMode && isFetching)}
                  className="h-[46px] sm:h-[52px] w-full sm:w-auto sm:min-w-[98px] cursor-pointer rounded-[10px] bg-[#6C5DD3] px-7 text-[14px] text-white hover:bg-[#6C5DD3]"
                >
                  Save
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

