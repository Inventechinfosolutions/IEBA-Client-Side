import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type {
  TimeStudyFieldLabelProps,
  TimeStudyInputShellProps,
  TimeStudyProgramFormProps,
  TimeStudySelectShellProps,
} from "../types"

function FieldLabel({ text }: TimeStudyFieldLabelProps) {
  return <label className="block text-[14px] text-[#111827]">{text}</label>
}

function InputShell({
  value,
  onChange,
  placeholder,
  disabled = false,
}: TimeStudyInputShellProps) {
  return (
    <Input
      value={value ?? ""}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="h-[44px] rounded-[10px] border border-[#d4d8e2] bg-white px-3 text-[14px] text-[#111827] placeholder:text-[14px] placeholder:text-[#b0b8c8] focus-visible:border-[#6C5DD3] focus-visible:ring-0 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100"
    />
  )
}

function SelectShell({
  value,
  onChange,
  options,
  placeholder,
  isOpen,
  setIsOpen,
  ariaLabel,
  disabled = false,
}: TimeStudySelectShellProps) {
  return (
    <div className="group/selector relative" data-ts-select-shell="true">
      <Input
        value={value ?? ""}
        readOnly
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (disabled) return
          setIsOpen(!isOpen)
        }}
        onFocus={() => {
          if (disabled) return
          setIsOpen(true)
        }}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "h-[44px] rounded-[7px] border border-[#c6cedd] bg-white px-3 pr-8 text-[14px] text-[#111827] shadow-none placeholder:text-[12px] placeholder:text-[#b0b8c8] focus-visible:border-[#6C5DD3] focus-visible:ring-0",
          "cursor-pointer select-none caret-transparent disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100",
          isOpen ? "border-[#3b82f6] ring-1 ring-[#3b82f640]" : ""
        )}
      />
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (disabled) return
          setIsOpen(!isOpen)
        }}
        className={cn(
          "absolute right-0 top-0 inline-flex h-full w-[20px] items-center justify-center text-[#6b7280]",
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        )}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        <ChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && !disabled ? (
        <div className="absolute z-10 mt-1 max-h-[180px] w-full overflow-auto rounded-[7px] border border-[#d9deea] bg-white p-1 shadow-[0_8px_18px_rgba(17,24,39,0.12)]">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option)
                setIsOpen(false)
              }}
              className={cn(
                "block w-full cursor-pointer rounded-[4px] px-2.5 py-1.5 text-left text-[14px] font-normal text-[#111827] hover:bg-[#e5e7eb]",
                value === option ? "bg-[#dbeafe]" : ""
              )}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function TimeStudyProgramForm({
  form,
  formMode,
  activeSection,
  departmentOptions,
  budgetProgramNameOptions,
  budgetProgramLookup,
}: TimeStudyProgramFormProps) {
  const [openSelectKey, setOpenSelectKey] = useState<string | null>(null)
  const isEditMode = formMode === "edit"

  if (activeSection === "BU Program") {
    return (
      <div className="mx-auto grid w-[500px] grid-cols-1 gap-4">
        <div className="space-y-1">
          <FieldLabel text="*Department" />
          <SelectShell
            value={form.watch("buProgramDepartment")}
            onChange={(value) =>
              form.setValue("buProgramDepartment", value, { shouldDirty: true, shouldValidate: true })
            }
            options={departmentOptions}
            placeholder="Select Department"
            isOpen={openSelectKey === "buProgramDepartment"}
            setIsOpen={(value) => setOpenSelectKey(value ? "buProgramDepartment" : null)}
            ariaLabel="Toggle department options"
            disabled={isEditMode}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel text="*Budget (BU) Program" />
          <SelectShell
            value={form.watch("buProgramBudgetUnitName")}
            onChange={(value) =>
              form.setValue("buProgramBudgetUnitName", value, { shouldDirty: true, shouldValidate: true })
            }
            options={budgetProgramNameOptions}
            placeholder="Select Budget (BU) Program"
            isOpen={openSelectKey === "buProgramBudgetUnitName"}
            setIsOpen={(value) => setOpenSelectKey(value ? "buProgramBudgetUnitName" : null)}
            ariaLabel="Toggle budget program options"
            disabled={isEditMode}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel text="*TS Program" />
          <InputShell
            value={form.watch("buProgramProgramName")}
            onChange={(value) =>
              form.setValue("buProgramProgramName", value, { shouldDirty: true, shouldValidate: true })
            }
            placeholder="Enter TS Program"
          />
        </div>
        <div className="space-y-1">
          <FieldLabel text="*TS Program Code" />
          <InputShell
            value={form.watch("buProgramProgramCode")}
            onChange={(value) =>
              form.setValue("buProgramProgramCode", value, { shouldDirty: true, shouldValidate: true })
            }
            placeholder="Enter TS Program Code"
          />
        </div>
        <label className="mt-2 inline-flex items-center gap-2 text-[14px] text-[#111827]">
          <Checkbox
            checked={form.watch("costAllocation")}
            onCheckedChange={(checked) =>
              form.setValue("costAllocation", checked === true, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            className="size-4 rounded-[3px] border-[#c7ccd7]"
          />
          Cost Allocation
        </label>

      </div>
    )
  }

  if (activeSection === "BU Sub-Program") {
    return (
      <div className="mx-auto grid w-[500px] grid-cols-1 gap-4">
        <div className="space-y-1">
          <FieldLabel text="*TS Program" />
          <SelectShell
            value={form.watch("buSubProgramBudgetUnitProgramName")}
            onChange={(value) => {
              form.setValue("buSubProgramBudgetUnitProgramName", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
              form.setValue("buSubProgramDepartment", budgetProgramLookup[value]?.department ?? "", {
                shouldDirty: true,
                shouldValidate: true,
              })
              form.setValue("buSubProgramBudgetCode", budgetProgramLookup[value]?.code ?? "", {
                shouldDirty: true,
                shouldValidate: true,
              })
            }}
            options={budgetProgramNameOptions}
            placeholder="Select TS Program"
            isOpen={openSelectKey === "buSubProgramBudgetUnitProgramName"}
            setIsOpen={(value) =>
              setOpenSelectKey(value ? "buSubProgramBudgetUnitProgramName" : null)
            }
            ariaLabel="Toggle TS program options"
            disabled={isEditMode}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel text="*Department" />
          <InputShell
            value={form.watch("buSubProgramDepartment")}
            placeholder="Enter Department"
            disabled
          />
        </div>
        <div className="space-y-1">
          <FieldLabel text="*Budget (BU) Program" />
          <InputShell
            value={form.watch("buSubProgramBudgetCode")}
            placeholder="Enter Budget (BU) Program"
            disabled
          />
        </div>
        <div className="space-y-1">
          <FieldLabel text="*TS Sub-Program One Name" />
          <InputShell
            value={form.watch("buSubProgramName")}
            onChange={(value) =>
              form.setValue("buSubProgramName", value, { shouldDirty: true, shouldValidate: true })
            }
            placeholder="Enter TS Sub-Program One Name"
          />
        </div>
        <div className="space-y-1">
          <FieldLabel text="*TS Sub-Program One Code" />
          <InputShell
            value={form.watch("buSubProgramCode")}
            onChange={(value) =>
              form.setValue("buSubProgramCode", value, { shouldDirty: true, shouldValidate: true })
            }
            placeholder="Enter TS Sub-Program One Code"
          />
        </div>
        <label className="mt-2 inline-flex items-center gap-2 text-[14px] text-[#111827]">
          <Checkbox
            checked={form.watch("costAllocation")}
            onCheckedChange={(checked) =>
              form.setValue("costAllocation", checked === true, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            className="size-4 rounded-[3px] border-[#c7ccd7]"
          />
          Cost Allocation
        </label>

      </div>
    )
  }

  return (
    <div className="mx-auto grid w-[500px] grid-cols-1 gap-4">
      <div className="space-y-1">
        <FieldLabel text="*TS Program" />
        <SelectShell
          value={form.watch("budgetUnitName")}
          onChange={(value) => {
            form.setValue("budgetUnitName", value, { shouldDirty: true, shouldValidate: true })
            form.setValue("budgetUnitCode", value, { shouldDirty: true, shouldValidate: true })
            form.setValue("budgetUnitDepartment", budgetProgramLookup[value]?.department ?? "", {
              shouldDirty: true,
              shouldValidate: true,
            })
            form.setValue("budgetUnitDescription", budgetProgramLookup[value]?.code ?? "", {
              shouldDirty: true,
              shouldValidate: true,
            })
          }}
          options={budgetProgramNameOptions}
          placeholder="Select TS Program"
          isOpen={openSelectKey === "budgetUnitName"}
          setIsOpen={(value) => setOpenSelectKey(value ? "budgetUnitName" : null)}
          ariaLabel="Toggle TS program options"
          disabled={isEditMode}
        />
      </div>
      <div className="space-y-1">
        <FieldLabel text="*TS Sub-Program Name" />
        <InputShell
          value={form.watch("budgetUnitCode")}
          disabled
          placeholder="Enter Program One Code"
        />
      </div>
      <div className="space-y-1">
        <FieldLabel text="*Department" />
        <InputShell
          value={form.watch("budgetUnitDepartment")}
          disabled
          placeholder="Enter Department"
        />
      </div>
      <div className="space-y-1">
        <FieldLabel text="*Budget (BU) Program" />
        <InputShell
          value={form.watch("budgetUnitDescription")}
          disabled
          placeholder="Enter Budget (BU) Program"
        />
      </div>
      <div className="space-y-1">
        <FieldLabel text="*TS Sub-Program Two Name" />
        <InputShell
          value={form.watch("buProgramProgramName")}
          onChange={(value) =>
            form.setValue("buProgramProgramName", value, { shouldDirty: true, shouldValidate: true })
          }
          placeholder="Enter TS Sub-Program Two Name"
        />
      </div>
      <div className="space-y-1">
        <FieldLabel text="*TS Sub-Program Two Code" />
        <InputShell
          value={form.watch("buProgramProgramCode")}
          onChange={(value) =>
            form.setValue("buProgramProgramCode", value, { shouldDirty: true, shouldValidate: true })
          }
          placeholder="Enter TS Sub-Program Two Code"
        />
      </div>
      <label className="mt-2 inline-flex items-center gap-2 text-[14px] text-[#111827]">
        <Checkbox
          checked={form.watch("costAllocation")}
          onCheckedChange={(checked) =>
            form.setValue("costAllocation", checked === true, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          className="size-4 rounded-[3px] border-[#c7ccd7]"
        />
        Cost Allocation
      </label>
    </div>
  )
}

