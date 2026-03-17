import { useCallback, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Bold, ChevronDown, ChevronUp, Italic, List } from "lucide-react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { masterCodeFormSchema } from "@/features/master-code/schemas"
import {
  type ActiveTools,
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
  const showPercentAndMatch = codeType !== "CDSS" && codeType !== "INTERNAL"
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
    formState: { errors },
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

  const handleScrollStep = (direction: "up" | "down") => {
    const delta = direction === "up" ? -36 : 36
    descriptionEditorRef.current?.scrollBy({ top: delta, behavior: "smooth" })
  }

  const closeModal = () => {
    setActiveTools({ bold: false, italic: false, bullet: false })
    onOpenChange(false)
  }

  const handleSave = handleSubmit((values) => {
    const editor = descriptionEditorRef.current
    const nextValues = editor
      ? { ...values, activityDescription: editor.innerHTML }
      : values
    onSave(nextValues)
    closeModal()
  })

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
        <form onSubmit={handleSave} className="bg-white px-7 pb-8 pt-7">
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
                className="h-[40px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] focus-visible:border-[var(--primary)] focus-visible:ring-1 focus-visible:ring-[#6554C033]"
              />
              {errors.code ? (
                <p className="text-[11px] text-[#b42318]">{errors.code.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="block text-[12px] text-[#111827]">{`*${codeType} Name`}</label>
              <Input
                {...register("name")}
                className="h-[40px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] focus-visible:border-[var(--primary)] focus-visible:ring-1 focus-visible:ring-[#6554C033]"
              />
              {errors.name ? (
                <p className="text-[11px] text-[#b42318]">{errors.name.message}</p>
              ) : null}
            </div>
            {showPercentAndMatch ? (
              <>
                <div className="space-y-1">
                  <label className="block text-[12px] text-[#111827]">{`*${codeType} (%)`}</label>
                  <Input
                    {...register("ffpPercent")}
                    className="h-[40px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] focus-visible:border-[var(--primary)] focus-visible:ring-1 focus-visible:ring-[#6554C033]"
                  />
                  {errors.ffpPercent ? (
                    <p className="text-[11px] text-[#b42318]">
                      {errors.ffpPercent.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <label className="block text-[12px] text-[#111827]">Match</label>
                  <Input
                    {...register("match")}
                    className="h-[40px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] focus-visible:border-[var(--primary)] focus-visible:ring-1 focus-visible:ring-[#6554C033]"
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
                className="max-h-[201px] min-h-[201px] overflow-y-scroll overflow-x-hidden whitespace-pre-wrap break-all [overflow-wrap:anywhere] bg-white px-3 py-2 pr-5 text-[13px] leading-6 text-[#111827] outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&::-webkit-scrollbar]:w-3.5 [&::-webkit-scrollbar-track]:bg-[#f1f2f6] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#98a1b0]"
              />
              {errors.activityDescription ? (
                <p className="px-3 pb-2 text-[11px] text-[#b42318]">
                  {errors.activityDescription.message}
                </p>
              ) : null}
              <button
                type="button"
                aria-label="Scroll up"
                onClick={() => handleScrollStep("up")}
                className="absolute right-0 top-8 z-10 inline-flex h-4 w-3.5 cursor-pointer items-center justify-center border-l border-b border-[#c9ced8] bg-[#eef0f4] text-[#7f8796]"
              >
                <ChevronUp className="size-3" />
              </button>
              <button
                type="button"
                aria-label="Scroll down"
                onClick={() => handleScrollStep("down")}
                className="absolute bottom-0 right-0 z-10 inline-flex h-4 w-3.5 cursor-pointer items-center justify-center border-l border-t border-[#c9ced8] bg-[#eef0f4] text-[#7f8796]"
              >
                <ChevronDown className="size-3" />
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <Button
              type="submit"
              className="h-[44px] min-w-[117px] cursor-pointer rounded-[10px] bg-[#6b5bd6] px-6 text-[13px] font-medium text-white hover:bg-[#6b5bd6]"
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
