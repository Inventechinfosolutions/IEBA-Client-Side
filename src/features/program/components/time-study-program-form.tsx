import { Checkbox } from "@/components/ui/checkbox"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { Input } from "@/components/ui/input"
import type {
  TimeStudyFieldLabelProps,
  TimeStudyInputShellProps,
  TimeStudyProgramFormProps,
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

export function TimeStudyProgramForm({
  form,
  formMode,
  activeSection,
  departmentOptions,
  budgetProgramNameOptions,
  budgetProgramLookup,
}: TimeStudyProgramFormProps) {
  const isEditMode = formMode === "edit"

  if (activeSection === "BU Program") {
    return (
      <div className="mx-auto grid w-[500px] grid-cols-1 gap-4">
        <div className="space-y-1">
          <FieldLabel text="*Department" />
          <SingleSelectDropdown
            value={form.watch("buProgramDepartment") ?? ""}
            onChange={(value) =>
              form.setValue("buProgramDepartment", value, { shouldDirty: true, shouldValidate: true })
            }
            onBlur={() => {}}
            options={departmentOptions.map((o) => ({ value: o, label: o }))}
            placeholder="Select Department"
            disabled={isEditMode}
            className="!min-h-[44px] h-[44px] !rounded-[7px] !border-[#c6cedd] !px-3 !pr-9 !text-[14px] !font-normal"
            itemButtonClassName="rounded-[4px] px-2.5 py-1.5"
            itemLabelClassName="!text-[14px]"
          />
        </div>
        <div className="space-y-1">
          <FieldLabel text="*Budget (BU) Program" />
          <SingleSelectDropdown
            value={form.watch("buProgramBudgetUnitName") ?? ""}
            onChange={(value) =>
              form.setValue("buProgramBudgetUnitName", value, { shouldDirty: true, shouldValidate: true })
            }
            onBlur={() => {}}
            options={budgetProgramNameOptions.map((o) => ({ value: o, label: o }))}
            placeholder="Select Budget (BU) Program"
            disabled={isEditMode}
            className="!min-h-[44px] h-[44px] !rounded-[7px] !border-[#c6cedd] !px-3 !pr-9 !text-[14px] !font-normal"
            itemButtonClassName="rounded-[4px] px-2.5 py-1.5"
            itemLabelClassName="!text-[14px]"
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
          <SingleSelectDropdown
            value={form.watch("buSubProgramBudgetUnitProgramName") ?? ""}
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
            onBlur={() => {}}
            options={budgetProgramNameOptions.map((o) => ({ value: o, label: o }))}
            placeholder="Select TS Program"
            disabled={isEditMode}
            className="!min-h-[44px] h-[44px] !rounded-[7px] !border-[#c6cedd] !px-3 !pr-9 !text-[14px] !font-normal"
            itemButtonClassName="rounded-[4px] px-2.5 py-1.5"
            itemLabelClassName="!text-[14px]"
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
        <SingleSelectDropdown
          value={form.watch("budgetUnitName") ?? ""}
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
          onBlur={() => {}}
          options={budgetProgramNameOptions.map((o) => ({ value: o, label: o }))}
          placeholder="Select TS Program"
          disabled={isEditMode}
          className="!min-h-[44px] h-[44px] !rounded-[7px] !border-[#c6cedd] !px-3 !pr-9 !text-[14px] !font-normal"
          itemButtonClassName="rounded-[4px] px-2.5 py-1.5"
          itemLabelClassName="!text-[14px]"
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

