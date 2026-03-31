import { useCallback, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Bold, ChevronDown, ChevronUp, Italic, List, X } from "lucide-react"
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
import { MasterCodeTypeEnum } from "@/features/master-code/enums/master-code-type.enum"
import { masterCodeFormSchema } from "@/features/master-code/schemas"
import {
  type ActiveTools,
  type MasterCodeFormFieldErrors,
  type MasterCodeFormModalProps,
  type MasterCodeFormValues,
} from "@/features/master-code/types"

export function MasterCodeFormModal({
  codeType,
  open,
  mode,
  initialValues,
  onOpenChange,
  onSave,
}: MasterCodeFormModalProps) {
  const descriptionEditorRef = useRef<HTMLDivElement | null>(null)
  const showPercentAndMatch =
    codeType !== MasterCodeTypeEnum.CDSS && codeType !== MasterCodeTypeEnum.INTERNAL
  const [activeTools, setActiveTools] = useState<ActiveTools>({
    bold: false,
    italic: false,
    bullet: false,
  })
  const {
    register,
    control,
    setValue,
    getValues,
    handleSubmit,
  } = useForm<MasterCodeFormValues>({
    resolver: zodResolver(masterCodeFormSchema),
    defaultValues: initialValues,
  })

  const toEditorHtml = (rawValue: string) => {
    const raw = rawValue ?? ""
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(raw)
    if (hasHtml) {
      return raw
    }

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


  const handlePercentStep = (direction: "up" | "down") => {
    const current = Number.parseFloat(String(getValues("ffpPercent") ?? "0"))
    const safeCurrent = Number.isFinite(current) ? current : 0
    const next = direction === "up" ? safeCurrent + 0.5 : safeCurrent - 0.5
    const clamped = Math.max(0, Math.min(100, next))
    setValue("ffpPercent", clamped.toFixed(2), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }
  const fieldOrder: (keyof MasterCodeFormValues)[] = [
    "code",
    "name",
    "ffpPercent",
    "activityDescription",
  ]
  const getErrorMessage = (value: unknown): string | null => {
    if (!value || typeof value !== "object") return null
    if ("message" in value && typeof value.message === "string" && value.message) {
      return value.message
    }
    const nestedValues = Object.values(value as MasterCodeFormFieldErrors)
    for (const nestedValue of nestedValues) {
      const nested = getErrorMessage(nestedValue)
      if (nested) return nested
    }
    return null
  }
  const getToastMessage = (
    field: keyof MasterCodeFormValues,
    fallbackMessage: string
  ): string => {
    if (field === "code") return `Please enter ${codeType} code`
    if (field === "name") return `Please enter ${codeType} name`
    if (field === "activityDescription") return `Please enter ${codeType} description`
    return fallbackMessage
  }

  const closeModal = () => {
    setActiveTools({ bold: false, italic: false, bullet: false })
    onOpenChange(false)
  }

  const handleSave = handleSubmit(
    (values) => {
      const editor = descriptionEditorRef.current
      const nextValues = editor
        ? { ...values, activityDescription: editor.innerHTML }
        : values
      onSave(nextValues)
      closeModal()
    },
    (formErrors: MasterCodeFormFieldErrors) => {
      const firstInvalidField = fieldOrder.find((field) => Boolean(formErrors[field]))
      if (!firstInvalidField) return
      const firstMessage = getErrorMessage(formErrors[firstInvalidField])
      if (firstMessage) {
        const toastMessage = getToastMessage(firstInvalidField, firstMessage)
        toast.error(toastMessage, {
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

  const title = mode === "edit" ? `Edit ${codeType}` : `Add ${codeType}`

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
        className="left-1/2 top-[8%] w-[749px] max-w-[calc(100vw-40px)] -translate-x-1/2 translate-y-0 gap-0 overflow-hidden rounded-[4px] border border-[#f4f6fb] bg-white p-0 text-[#0f172a] subpixel-antialiased shadow-[0_6px_18px_rgba(22,29,45,0.12)]"
      >
        <form onSubmit={handleSave} className="select-none bg-white px-7 pb-8 pt-7">
          <DialogHeader className="relative items-center pb-5">
            <DialogTitle className="text-[18px] font-semibold text-[#111827]">
              {title}
            </DialogTitle>
            <label className="absolute right-4 top-[4px] inline-flex cursor-pointer items-center gap-1.5 text-[12px] font-medium text-[#20263a]">
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="size-3.5 rounded-[3px] border-[#b8bbcc] bg-white data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)] [&_svg]:size-3"
                  />
                )}
              />
              *Active
            </label>
          </DialogHeader>

          <div
            className={`grid items-end gap-5 ${
              showPercentAndMatch
                ? "grid-cols-[92px_minmax(0,1fr)_92px_92px]"
                : "grid-cols-[128px_minmax(0,50%)]"
            }`}
          >
            <div className="space-y-1">
              <label className="block whitespace-nowrap text-[12px] text-[#111827]">{`*${codeType} Code`}</label>
              <Input
                {...register("code")}
                className="h-[40px] select-text rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[12px] text-[#111827]">{`*${codeType} Name`}</label>
              <Input
                {...register("name")}
                className="h-[40px] select-text rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
            </div>
            {showPercentAndMatch ? (
              <>
                <div className="space-y-1">
                  <label className="block text-[12px] text-[#111827]">{`*${codeType} (%)`}</label>
                  <div className="group/percent relative rounded-[9px]">
                    <Input
                      {...register("ffpPercent")}
                      type="number"
                      step="0.50"
                      min="0"
                      max="100"
                      className="h-[40px] select-text rounded-[9px] border border-[#c5cad5] bg-white px-2.5 pr-6 text-[13px] text-[#111827] [appearance:textfield] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333] group-focus-within/percent:border-[#6C5DD3] group-focus-within/percent:ring-1 group-focus-within/percent:ring-[#6C5DD333] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      aria-label="Increase percent"
                      onClick={() => handlePercentStep("up")}
                      className="absolute right-0 top-0 z-10 inline-flex h-1/2 w-[18px] cursor-pointer items-center justify-center rounded-tr-[9px] border-l border-b border-[#c9ced8] bg-[#eef0f4] text-[#7f8796] opacity-0 transition-opacity group-hover/percent:opacity-100 group-focus-within/percent:opacity-100"
                    >
                      <ChevronUp className="size-[11px]" />
                    </button>
                    <button
                      type="button"
                      aria-label="Decrease percent"
                      onClick={() => handlePercentStep("down")}
                      className="absolute bottom-0 right-0 z-10 inline-flex h-1/2 w-[18px] cursor-pointer items-center justify-center rounded-br-[9px] border-l border-t border-[#c9ced8] bg-[#eef0f4] text-[#7f8796] opacity-0 transition-opacity group-hover/percent:opacity-100 group-focus-within/percent:opacity-100"
                    >
                      <ChevronDown className="size-[11px]" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[12px] text-[#111827]">Match</label>
                  <Input
                    {...register("match")}
                    className="h-[40px] select-text rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
                  />
                </div>
              </>
            ) : null}
          </div>

          <div className="mt-3 flex flex-col items-start gap-1.5">
            <label className="flex items-center gap-2 text-[12px] leading-none text-[#111827]">
              <Controller
                name="spmp"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="size-3.5 rounded-[3px] border-[#c2c6d1] bg-white data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)] [&_svg]:size-3"
                  />
                )}
              />
              SPMP
            </label>
            <label className="flex items-center gap-2 text-[12px] leading-none text-[#111827]">
              <Controller
                name="allocable"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="size-3.5 rounded-[3px] border-[#c2c6d1] bg-white data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)] [&_svg]:size-3"
                  />
                )}
              />
              Allocable
            </label>
          </div>

          <div className="mt-2">
            <label className="block text-[12px] text-[#111827]">*Activity Description</label>
            <div className="relative mt-1.5 overflow-hidden rounded-[10px] border border-[#c5cad5] bg-white">
              <div className="flex h-8 items-center gap-4 border-b border-[#d3d8e2] px-3 text-[#4b5563]">
                <button
                  type="button"
                  onClick={() => applyCommand("bold")}
                  className={`inline-flex cursor-pointer items-center text-[13px] transition-colors ${
                    activeTools.bold
                      ? "scale-110 font-extrabold text-[var(--primary)]"
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
                      ? "scale-110 font-extrabold text-[var(--primary)]"
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
                      ? "scale-110 font-extrabold text-[var(--primary)]"
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
                className="program-table-scroll max-h-[201px] min-h-[201px] select-text overflow-y-scroll overflow-x-hidden whitespace-pre-wrap break-all [overflow-wrap:anywhere] bg-white px-3 py-2 pr-5 text-[13px] leading-6 text-[#111827] outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5"
              />

            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <Button
              type="submit"
              className="h-[44px] min-w-[117px] cursor-pointer rounded-[10px] bg-[#6C5DD3] px-6 text-[13px] font-medium text-white hover:bg-[#6C5DD3]"
            >
              Save
            </Button>
            <Button
              type="button"
              onClick={closeModal}
              className="h-[44px] min-w-[111px] cursor-pointer rounded-[10px] bg-[#d2d4d9] px-6 text-[13px] font-medium text-[#111827] hover:bg-[#d2d4d9]"
            >
              Exit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

