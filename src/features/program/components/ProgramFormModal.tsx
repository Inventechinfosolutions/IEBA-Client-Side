import { zodResolver } from "@hookform/resolvers/zod"
import { X } from "lucide-react"
import { forwardRef, useImperativeHandle, useRef, useState } from "react"
import { useForm, type FieldErrors, type FieldValues } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BudgetUnitsForm } from "./BudgetUnitsForm"
import { TimeStudyProgramForm } from "./TimeStudyProgramForm"
import {
  useGetProgramFormOptions,
  useGetActivePrimaryTimeStudyPrograms,
} from "../queries/getProgramFormOptions"
import { programFormSchema, timeStudyProgramFormSchema } from "../schemas"
import type {
  ProgramFormModalHandle,
  ProgramFormModalProps,
  ProgramFormSection,
  ProgramFormValues,
} from "../types"

export const ProgramFormModal = forwardRef<ProgramFormModalHandle, ProgramFormModalProps>(function ProgramFormModal({
  open,
  mode,
  initialValues,
  hideSectionTabs = false,
  lockSectionTabs = false,
  contextTab,
  isSubmitting = false,
  onOpenChange,
  onSave,
}: ProgramFormModalProps, ref) {
  const isTimeStudyContext = contextTab === "Time Study programs"
  const sections: ProgramFormSection[] = isTimeStudyContext
    ? ["BU Program", "BU Sub-Program", "Budget Unit"]
    : ["Budget Unit", "BU Program", "BU Sub-Program"]
  const sectionLabelMap: Record<ProgramFormSection, string> = {
    "Budget Unit": isTimeStudyContext ? "TS Sub-Program Two" : "Budget Unit",
    "BU Program": isTimeStudyContext ? "TS Primary Program" : "BU Program",
    "BU Sub-Program": isTimeStudyContext ? "TS Sub-Program One" : "BU Sub-Program",
  }

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(isTimeStudyContext ? timeStudyProgramFormSchema : programFormSchema),
    values: initialValues,
  })

  const [pendingSection, setPendingSection] = useState<ProgramFormSection | null>(null)
  const activeSection = form.watch("formSection") as ProgramFormSection

  const formOptionsQuery = useGetProgramFormOptions(open && mode === "add", contextTab)
  const departmentOptions = formOptionsQuery.data?.departmentOptions ?? []
  const budgetUnitNameOptions = formOptionsQuery.data?.budgetUnitNameOptions ?? []
  const budgetUnitLookup = formOptionsQuery.data?.budgetUnitLookup ?? {}
  const isTsSecondaryOrTertiary = isTimeStudyContext && (activeSection === "BU Sub-Program" || activeSection === "Budget Unit")

  // Budget Program options:
  // - Budget Units context: use Budget Programs (type=program) from form options
  // - Time Study context, TS Sub-Program One & Two: use Time Study Primary Programs
  const tsPrimaryProgramsQuery = useGetActivePrimaryTimeStudyPrograms(
    open && mode === "add" && isTsSecondaryOrTertiary
  )

  const budgetProgramNameOptions = isTsSecondaryOrTertiary
    ? tsPrimaryProgramsQuery.data?.budgetProgramNameOptions ?? []
    : formOptionsQuery.data?.budgetProgramNameOptions ?? []

  const budgetProgramLookup = isTsSecondaryOrTertiary
    ? tsPrimaryProgramsQuery.data?.budgetProgramLookup ?? {}
    : formOptionsQuery.data?.budgetProgramLookup ?? {}

  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false)
  const departmentDropdownRef = useRef<HTMLDivElement | null>(null)
  const [isBuNameOpen, setIsBuNameOpen] = useState(false)
  const buNameDropdownRef = useRef<HTMLDivElement | null>(null)
  const [isBudgetProgramOpen, setIsBudgetProgramOpen] = useState(false)
  const budgetProgramDropdownRef = useRef<HTMLDivElement | null>(null)

  useImperativeHandle(ref, () => ({
    reset(values: ProgramFormValues) {
      form.reset(values)
      setPendingSection(null)
    },
  }), [form])

  const applySectionChange = (nextSection: ProgramFormSection) => {
    form.setValue("formSection", nextSection, { shouldDirty: true })
  }

  const fieldOrderBySection: Record<ProgramFormSection, (keyof ProgramFormValues)[]> =
    isTimeStudyContext
      ? {
          "Budget Unit": [
            "budgetUnitName",
            "budgetUnitCode",
            "budgetUnitDepartment",
            "budgetUnitDescription",
            "buProgramProgramName",
            "buProgramProgramCode",
          ],
          "BU Program": [
            "buProgramDepartment",
            "buProgramBudgetUnitName",
            "buProgramProgramName",
            "buProgramProgramCode",
          ],
          "BU Sub-Program": [
            "buSubProgramBudgetUnitProgramName",
            "buSubProgramDepartment",
            "buSubProgramBudgetCode",
            "buSubProgramName",
            "buSubProgramCode",
          ],
        }
      : {
          "Budget Unit": [
            "budgetUnitDepartment",
            "budgetUnitCode",
            "budgetUnitName",
            "budgetUnitDescription",
            "budgetUnitMedicalPct",
          ],
          "BU Program": [
            "buProgramBudgetUnitName",
            "buProgramCode",
            "buProgramDepartment",
            "buProgramProgramCode",
            "buProgramProgramName",
            "buProgramDescription",
            "buProgramMedicalPct",
          ],
          "BU Sub-Program": [
            "buSubProgramBudgetUnitProgramName",
            "buSubProgramBudgetCode",
            "buSubProgramDepartment",
            "buSubProgramCode",
            "buSubProgramName",
            "buSubProgramDescription",
            "buSubProgramMedicalPct",
          ],
        }

  const getErrorMessage = (value: unknown): string | null => {
    if (!value || typeof value !== "object") return null
    if ("message" in value && typeof value.message === "string" && value.message) {
      return value.message
    }
    const nestedValues = Object.values(value as FieldErrors<FieldValues>)
    for (const nestedValue of nestedValues) {
      const nested = getErrorMessage(nestedValue)
      if (nested) return nested
    }
    return null
  }

  const showInvalidToast = (formErrors: FieldErrors<ProgramFormValues>) => {
    const fieldOrder = fieldOrderBySection[form.getValues("formSection")]
    const firstInvalidField = fieldOrder.find((field) => Boolean(formErrors[field]))
    if (!firstInvalidField) return
    const firstMessage = getErrorMessage(formErrors[firstInvalidField])
    if (!firstMessage) return

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

  const handleSubmit = form.handleSubmit((values) => {
    onSave({ ...values, formSection: activeSection })
  }, showInvalidToast)

  const hasUnsavedChangesInSection = (section: ProgramFormSection) => {
    const dirtyFields = form.formState.dirtyFields as Partial<
      Record<keyof ProgramFormValues, boolean | undefined>
    >
    return fieldOrderBySection[section].some((field) => Boolean(dirtyFields[field]))
  }

  const handleSectionChange = (nextSection: ProgramFormSection) => {
    if (lockSectionTabs) return
    if (nextSection === activeSection) return
    if (hasUnsavedChangesInSection(activeSection)) {
      setPendingSection(nextSection)
      return
    }
    applySectionChange(nextSection)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        overlayClassName="bg-black/40"
        className={`left-1/2 top-[5%] w-[760px] max-w-[calc(100vw-40px)] -translate-x-1/2 translate-y-0 gap-0 overflow-hidden rounded-[8px] border bg-white p-0 text-[#0f172a] subpixel-antialiased shadow-[0_6px_18px_rgba(22,29,45,0.12)] ${
          pendingSection ? "border-transparent" : "border-[#f4f6fb]"
        }`}
      >
        {!hideSectionTabs ? (
          <div className="grid grid-cols-3 bg-white p-px">
            {sections.map((section) => (
              <button
                key={section}
                type="button"
                aria-disabled={lockSectionTabs}
                onClick={() => handleSectionChange(section)}
                className={`h-[58px] rounded-[8px] border text-[12px] ${
                  activeSection === section
                    ? "border-[var(--primary)] bg-[var(--primary)] font-medium text-white"
                    : "border-[#e8e9ef] bg-white text-[#4f5970]"
                } ${lockSectionTabs ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                {sectionLabelMap[section]}
              </button>
            ))}
          </div>
        ) : null}
        <form
          onSubmit={handleSubmit}
          onMouseDownCapture={(event) => {
            const targetNode = event.target as Node

            if (
              isDepartmentOpen &&
              !departmentDropdownRef.current?.contains(targetNode)
            ) {
              setIsDepartmentOpen(false)
            }

            if (isBuNameOpen && !buNameDropdownRef.current?.contains(targetNode)) {
              setIsBuNameOpen(false)
            }

            if (
              isBudgetProgramOpen &&
              !budgetProgramDropdownRef.current?.contains(targetNode)
            ) {
              setIsBudgetProgramOpen(false)
            }
          }}
          className="select-none bg-white px-10 pb-8 pt-7 [&_input]:!text-[14px] [&_input::placeholder]:text-[12px] [&_input::placeholder]:text-[#b0b8c8]"
        >
          <input type="hidden" {...form.register("formSection")} />
          <DialogHeader className="mx-auto w-[500px] pb-5">
            <DialogTitle className="text-center text-[22px] font-semibold text-[#111827]">
              {isTimeStudyContext
                ? mode === "edit"
                  ? activeSection === "BU Program"
                    ? "Edit Time Study Primary Program"
                    : activeSection === "BU Sub-Program"
                      ? "Edit Time Study Sub Program One"
                      : "Edit Time Study Sub Program Two"
                  : activeSection === "BU Program"
                    ? "Add Time Study Primary Program"
                    : activeSection === "BU Sub-Program"
                      ? "Add Time Study Sub Program One"
                      : "Add Time Study Sub Program Two"
                : mode === "edit"
                ? activeSection === "Budget Unit"
                  ? "Edit Budget Unit (BU) Name"
                  : activeSection === "BU Program"
                    ? "Edit Budget Unit Program"
                    : "Edit Budget Unit Sub-Program"
                : hideSectionTabs && activeSection === "BU Sub-Program"
                  ? "Add Sub Program"
                  : activeSection === "Budget Unit"
                  ? "Add Budget Unit (BU) Name"
                  : activeSection === "BU Program"
                    ? "Add Budget Unit Program"
                    : "Add Budget Unit Sub-Program"}
            </DialogTitle>
            <div className="mt-2 flex justify-end">
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-[14px] font-medium text-[#20263a]">
                <Checkbox
                  checked={form.watch("active")}
                  onCheckedChange={(checked) => form.setValue("active", checked === true)}
                  className="size-4 rounded-[3px] border-[#b8bbcc] bg-white data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)] [&_svg]:size-3.5"
                />
                *Active
              </label>
            </div>
          </DialogHeader>
          {isTimeStudyContext ? (
            <TimeStudyProgramForm
              form={form}
              formMode={mode}
              activeSection={activeSection}
              departmentOptions={departmentOptions}
              budgetProgramNameOptions={budgetProgramNameOptions}
              budgetProgramLookup={budgetProgramLookup}
            />
          ) : (
            <BudgetUnitsForm
              form={form}
              activeSection={activeSection}
              formMode={mode}
              quickAddSubProgramMode={hideSectionTabs && activeSection === "BU Sub-Program"}
              departmentOptions={departmentOptions}
              isDepartmentOpen={isDepartmentOpen}
              setIsDepartmentOpen={setIsDepartmentOpen}
              departmentDropdownRef={departmentDropdownRef}
              budgetUnitNameOptions={budgetUnitNameOptions}
              budgetProgramNameOptions={budgetProgramNameOptions}
              budgetProgramLookup={budgetProgramLookup}
              budgetUnitLookup={budgetUnitLookup}
              isBuNameOpen={isBuNameOpen}
              setIsBuNameOpen={setIsBuNameOpen}
              buNameDropdownRef={buNameDropdownRef}
              isBudgetProgramOpen={isBudgetProgramOpen}
              setIsBudgetProgramOpen={setIsBudgetProgramOpen}
              budgetProgramDropdownRef={budgetProgramDropdownRef}
            />
          )}
          <div className="mx-auto mt-6 flex w-[500px] items-center justify-end gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-[44px] min-w-[117px] cursor-pointer rounded-[10px] bg-[#6C5DD3] px-6 text-[15px] font-medium text-white hover:bg-[#6C5DD3]"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-[44px] min-w-[111px] cursor-pointer rounded-[10px] bg-[#d2d4d9] px-6 text-[15px] font-medium text-[#111827] hover:bg-[#d2d4d9]"
            >
              Exit
            </Button>
          </div>
        </form>
        {pendingSection ? (
          <div className="absolute inset-0 z-20 flex items-start justify-center bg-black/25 pt-[70px]">
            <div className="w-[528px] rounded-[4px] bg-white px-6 py-5 shadow-[0_10px_24px_rgba(17,24,39,0.2)]">
              <p className="text-[16px] font-medium leading-[1.2] text-[#111827]">
                Are you sure do you want to switch? there are unsaved changes
              </p>
              <div className="mt-6 flex w-full items-center justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => setPendingSection(null)}
                  className="h-[44px] min-w-[65px] cursor-pointer rounded-[8px] bg-[#d2d4d9] px-5 text-[14px] font-medium text-[#111827] hover:bg-[#d2d4d9]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (pendingSection) applySectionChange(pendingSection)
                    setPendingSection(null)
                  }}
                  className="h-[44px] min-w-[72px] cursor-pointer rounded-[10px] bg-[var(--primary)] px-5 text-[14px] font-medium text-white hover:bg-[var(--primary)]"
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
})

