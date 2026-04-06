import { useCallback, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Bold, Italic, List, X, Check } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { jobClassificationFormSchema } from "../schemas"
import type { JobClassificationFormModalProps, JobClassificationFormValues, ActiveTools } from "../types"



export function JobClassificationFormModal({
  open,
  mode,
  initialValues,
  isSubmitting,
  onOpenChange,
  onSave,
}: JobClassificationFormModalProps) {
  const descriptionEditorRef = useRef<HTMLDivElement | null>(null)
  const [activeTools, setActiveTools] = useState<ActiveTools>({
    bold: false,
    italic: false,
    bullet: false,
  })

  const safeInitialValues = {
    ...initialValues,
    activityDescription: initialValues?.activityDescription ?? "",
  }

  const {
    register,
    control,
    setValue,
    getValues,
    handleSubmit,
    reset,
  } = useForm<JobClassificationFormValues>({
    resolver: zodResolver(jobClassificationFormSchema),
    defaultValues: safeInitialValues,
    values: safeInitialValues,
  })

  const toEditorHtml = (rawValue?: string) => {
    const raw = rawValue ?? ""
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(raw)
    if (hasHtml) return raw
    return raw
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\n", "<br>")
  }

  const setDescriptionEditorRef = useCallback(
    (node: HTMLDivElement | null) => {
      descriptionEditorRef.current = node
      if (!node) return
      node.innerHTML = toEditorHtml(getValues("activityDescription"))
    },
    [getValues]
  )

  const refreshActiveTools = () => {
    setActiveTools({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      bullet: document.queryCommandState("insertUnorderedList"),
    })
  }

  const applyCommand = (command: "bold" | "italic" | "insertUnorderedList") => {
    const editor = descriptionEditorRef.current
    if (!editor) return
    editor.focus()
    document.execCommand(command, false)
    setValue("activityDescription", editor.innerHTML, {
      shouldDirty: true,
      shouldValidate: true,
    })
    refreshActiveTools()
  }

  const syncEditorValue = () => {
    const editor = descriptionEditorRef.current
    if (!editor) return
    setValue("activityDescription", editor.innerHTML, {
      shouldDirty: true,
      shouldValidate: true,
    })
    refreshActiveTools()
  }


  const closeModal = () => {
    setActiveTools({ bold: false, italic: false, bullet: false })
    reset()
    onOpenChange(false)
  }

  const fieldOrder: (keyof JobClassificationFormValues)[] = ["code", "name"]
  const getErrorMessage = (value: unknown): string | null => {
    if (!value || typeof value !== "object") return null
    if ("message" in value && typeof value.message === "string" && value.message) {
      return value.message
    }
    const nestedValues = Object.values(value as Record<string, unknown>)
    for (const nestedValue of nestedValues) {
      const nested = getErrorMessage(nestedValue)
      if (nested) return nested
    }
    return null
  }

  const handleSave = handleSubmit(
    (values: JobClassificationFormValues) => {
      const editor = descriptionEditorRef.current
      const nextValues = editor
        ? { ...values, activityDescription: editor.innerHTML }
        : values
      onSave(nextValues)
      toast.success(
        mode === "edit"
          ? "Job classification updated successfully"
          : "Job classification saved successfully",
        {
          position: "top-center",
          icon: (
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#10b981] text-white">
              <Check className="size-3 stroke-[3]" />
            </span>
          ),
          className:
            "!w-fit !max-w-[340px] !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
        }
      )
      closeModal()
    },
    (formErrors) => {
      const firstInvalidField = fieldOrder.find((field) => Boolean(formErrors[field]))
      if (!firstInvalidField) return
      const firstMessage = getErrorMessage(formErrors[firstInvalidField])
      if (firstMessage) {
        toast.error(firstMessage, {
          position: "top-center",
          icon: (
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#ef4444] text-white">
              <X className="size-3 stroke-[2.5]" />
            </span>
          ),
          className:
            "!w-fit !max-w-[340px] !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
        })
      }
    }
  )

  const title = mode === "edit" ? "Edit Job Classification" : "Add Job Classification"

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeModal()
          return
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        showClose={false}
        overlayClassName="bg-black/40"
        className="left-1/2 top-[8%] w-[880px] max-w-[calc(100vw-40px)] -translate-x-1/2 translate-y-0 gap-0 overflow-hidden rounded-[4px] border border-[#f4f6fb] bg-white p-0 text-[#0f172a] subpixel-antialiased shadow-[0_6px_18px_rgba(22,29,45,0.12)]"
      >
        <form onSubmit={handleSave} className="select-none bg-white px-11 pb-8 pt-7">
          <DialogHeader className="relative items-center pb-8">
            <DialogTitle className="text-[22px] font-semibold text-[#111827]">
              {title}
            </DialogTitle>
            <label className="absolute right-0 top-[35px] inline-flex cursor-pointer items-center gap-1.5 text-[16px] font-medium text-[#20263a]">
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="size-4 rounded-[3px] border-[#b8bbcc] bg-white data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)] [&_svg]:size-3"
                  />
                )}
              />
              Active
            </label>
          </DialogHeader>

          <div className="grid grid-cols-[220px_minmax(0,1fr)] items-end gap-5">
            <div className="space-y-1">
              <label className="block text-[14px] text-[#111827] mb-1">*Code</label>
              <Input
                {...register("code")}
                placeholder="Job Code"
                className="h-[52px] select-text rounded-[9px] border border-[#c5cad5] bg-white px-3 text-[14px] text-[#111827] placeholder:text-[#a7afbf] placeholder:text-[12px] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[14px] text-[#111827] mb-1">*Name</label>
              <Input
                {...register("name")}
                placeholder="Job Classification"
                className="h-[52px] select-text rounded-[9px] border border-[#c5cad5] bg-white px-3 text-[14px] text-[#111827] placeholder:text-[#a7afbf] placeholder:text-[12px] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
            </div>
          </div>

          <div className="mt-5 relative">
            <label className="block text-[14px] text-[#111827] mb-1.5">Activity Description</label>
            <div className="relative overflow-hidden rounded-[10px] border border-[#c5cad5] bg-white">
              <div className="flex h-8 items-center gap-4 border-b border-[#d3d8e2] px-3 text-[#4b5563]">
                <button
                  type="button"
                  onClick={() => applyCommand("bold")}
                  className={`inline-flex cursor-pointer items-center text-[13px] transition-colors ${
                    activeTools.bold
                      ? "scale-110 font-extrabold text-[#6C5DD3]"
                      : "text-[#374151]"
                  }`}
                >
                  <Bold className={activeTools.bold ? "size-4.5" : "size-4"} />
                </button>
                <button
                  type="button"
                  onClick={() => applyCommand("insertUnorderedList")}
                  className={`inline-flex cursor-pointer items-center text-[13px] transition-colors ${
                    activeTools.bullet
                      ? "scale-110 font-extrabold text-[#6C5DD3]"
                      : "text-[#374151]"
                  }`}
                >
                  <List className={activeTools.bullet ? "size-4.5" : "size-4"} />
                </button>
                <button
                  type="button"
                  onClick={() => applyCommand("italic")}
                  className={`inline-flex cursor-pointer items-center text-[13px] transition-colors ${
                    activeTools.italic
                      ? "scale-110 font-extrabold text-[#6C5DD3]"
                      : "text-[#374151]"
                  }`}
                >
                  <Italic className={activeTools.italic ? "size-4.5" : "size-4"} />
                </button>
              </div>
              <div
                ref={setDescriptionEditorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={syncEditorValue}
                onClick={refreshActiveTools}
                onKeyUp={refreshActiveTools}
                className="program-table-scroll max-h-[260px] min-h-[260px] select-text overflow-y-scroll overflow-x-hidden whitespace-pre-wrap break-all [overflow-wrap:anywhere] bg-white px-3 py-2 pr-5 text-[14px] leading-6 text-[#111827] outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5"
              />

            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-[50px] min-w-[100px] cursor-pointer rounded-[10px] bg-[#6C5DD3] px-6 text-[14px] font-medium text-white hover:bg-[#6C5DD3] disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="h-[50px] min-w-[100px] cursor-pointer rounded-[10px] bg-[#d2d4d9] px-6 text-[14px] font-medium text-[#111827] hover:bg-[#d2d4d9] disabled:opacity-50"
            >
              Exit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

