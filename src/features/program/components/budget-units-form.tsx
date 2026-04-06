import { ChevronDown, ChevronUp } from "lucide-react"

import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { BudgetUnitsFormProps } from "../types"

export function BudgetUnitsForm({
  form,
  activeSection,
  formMode,
  quickAddSubProgramMode = false,
  departmentOptions,
  budgetUnitNameOptions,
  budgetProgramNameOptions,
  budgetProgramLookup,
  budgetUnitLookup,
}: BudgetUnitsFormProps) {
  const handleMedicalPctChange = (
    field: "budgetUnitMedicalPct" | "buProgramMedicalPct" | "buSubProgramMedicalPct",
    rawValue: string
  ) => {
    if (!rawValue) {
      form.setValue(field, "0.00", { shouldDirty: true, shouldTouch: true })
      return
    }

    const nextValue = Number(rawValue)
    if (Number.isNaN(nextValue) || nextValue < 0) return

    form.setValue(field, nextValue.toFixed(2), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const handleMedicalPctBlur = (
    field: "budgetUnitMedicalPct" | "buProgramMedicalPct" | "buSubProgramMedicalPct"
  ) => {
    const value = Number(form.getValues(field) || "0")
    form.setValue(field, Math.max(0, value).toFixed(2), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const handleMedicalPctStep = (
    field: "budgetUnitMedicalPct" | "buProgramMedicalPct" | "buSubProgramMedicalPct",
    delta: number
  ) => {
    const current = Number(form.getValues(field) || "0")
    const safeCurrent = Number.isNaN(current) ? 0 : current
    const next = Math.max(0, safeCurrent + delta)
    form.setValue(field, next.toFixed(2), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const renderMedicalPctInput = (
    field: "budgetUnitMedicalPct" | "buProgramMedicalPct" | "buSubProgramMedicalPct",
    inputHeightClass = "h-[40px]"
  ) => {
    const currentValue = Number(form.watch(field) || "0")
    const isDecrementDisabled = Number.isNaN(currentValue) || currentValue <= 0

    return (
      <div className="group relative">
        <Input
          type="text"
          inputMode="decimal"
          value={form.watch(field) || "0.00"}
          onChange={(event) => handleMedicalPctChange(field, event.target.value)}
          onBlur={() => handleMedicalPctBlur(field)}
          onKeyDown={(event) => {
            if (event.key === "-" || event.key.toLowerCase() === "e") {
              event.preventDefault()
            }
          }}
          className={`${inputHeightClass} rounded-[9px] border border-[#c5cad5] bg-white px-2.5 pr-8 text-[13px] text-[#111827] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]`}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-[24px] flex-col border-l border-[#d5daea] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => handleMedicalPctStep(field, 1)}
            className="pointer-events-auto inline-flex h-1/2 w-full cursor-pointer items-center justify-center text-[#8c93a8] hover:text-[var(--primary)]"
            aria-label="Increase medical pct"
          >
            <ChevronUp className="size-2.5" />
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (isDecrementDisabled) return
              handleMedicalPctStep(field, -1)
            }}
            disabled={isDecrementDisabled}
            className={`pointer-events-auto inline-flex h-1/2 w-full items-center justify-center border-t border-[#d5daea] ${
              isDecrementDisabled
                ? "cursor-not-allowed text-[#c5cad5]"
                : "cursor-pointer text-[#8c93a8] hover:text-[var(--primary)]"
            }`}
            aria-label="Decrease medical pct"
          >
            <ChevronDown className="size-2.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto grid w-[500px] grid-cols-1 gap-4">
      {activeSection === "Budget Unit" ? (
        <>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">*Department</label>
            {formMode === "edit" ? (
              <Input
                value={form.watch("budgetUnitDepartment") || ""}
                disabled
                readOnly
                tabIndex={-1}
                className="h-[44px] rounded-[7px] border border-[#c6cedd] px-3 text-[14px] font-normal text-[#111827] shadow-none disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100"
              />
            ) : (
              <SingleSelectDropdown
                value={form.watch("budgetUnitDepartment") ?? ""}
                onChange={(department) => {
                  form.setValue("budgetUnitDepartment", department, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                }}
                onBlur={() => {}}
                options={departmentOptions.map((d) => ({ value: d, label: d }))}
                placeholder="Select Department"
                className="!min-h-[44px] h-[44px] !rounded-[7px] !border-[#c6cedd] !px-3 !pr-9 !text-[14px] !font-normal focus-visible:!border-[#6C5DD3] focus-visible:!ring-0"
                itemButtonClassName="rounded-[4px] px-2.5 py-1.5"
                itemLabelClassName="!text-[14px]"
              />
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">*BU Code</label>
            <Input
              {...form.register("budgetUnitCode")}
              placeholder="Enter budget unit code"
              className="h-[40px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">*BU Name</label>
            <Input
              {...form.register("budgetUnitName")}
              placeholder="Enter budget unit name"
              className="h-[40px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">*Description</label>
            <Textarea
              {...form.register("budgetUnitDescription")}
              placeholder="Enter Description"
              className="!h-[70px] resize-none rounded-[9px] border border-[#c5cad5] bg-white px-2.5 py-2 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">*Medical Pct</label>
            {renderMedicalPctInput("budgetUnitMedicalPct")}
          </div>
        </>
      ) : activeSection === "BU Program" ? (
        <>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">*BU Name</label>
            {formMode === "edit" ? (
              <Input
                value={form.watch("buProgramBudgetUnitName") || ""}
                disabled
                readOnly
                tabIndex={-1}
                placeholder="Select Budget Unit"
                className="h-[44px] rounded-[7px] border border-[#c6cedd] px-3 text-[14px] font-normal text-[#111827] shadow-none placeholder:text-[12px] placeholder:text-[#b0b8c8] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100"
              />
            ) : (
              <SingleSelectDropdown
                value={form.watch("buProgramBudgetUnitName") ?? ""}
                onChange={(name) => {
                  form.setValue("buProgramBudgetUnitName", name, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                  form.setValue("buProgramCode", budgetUnitLookup[name]?.code ?? "", {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                  form.setValue("buProgramDepartment", budgetUnitLookup[name]?.department ?? "", {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                }}
                onBlur={() => {}}
                options={budgetUnitNameOptions.map((n) => ({ value: n, label: n }))}
                placeholder="Select Budget Unit"
                className="!min-h-[44px] h-[44px] !rounded-[7px] !border-[#c6cedd] !px-3 !pr-9 !text-[14px] !font-normal focus-visible:!border-[#6C5DD3] focus-visible:!ring-0"
                itemButtonClassName="rounded-[4px] px-2.5 py-1.5"
                itemLabelClassName="!text-[14px]"
              />
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">*BU Code</label>
            <Input
              {...form.register("buProgramCode")}
              disabled
              placeholder="Enter BU Code"
              className="h-[40px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">*Department</label>
            <Input
              {...form.register("buProgramDepartment")}
              disabled
              placeholder="Select Department"
              className="h-[40px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[14px] text-[#111827]">*BU Program Code</label>
              <Input
                {...form.register("buProgramProgramCode")}
                placeholder="Enter Program Code"
                className="h-[40px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[14px] text-[#111827]">*BU Program</label>
              <Input
                {...form.register("buProgramProgramName")}
                placeholder="Enter Program Name"
                className="h-[40px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">*Description</label>
            <Textarea
              {...form.register("buProgramDescription")}
              placeholder="Enter Program Description"
              className="!h-[70px] resize-none rounded-[9px] border border-[#c5cad5] bg-white px-2.5 py-2 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">*Medical Pct</label>
            {renderMedicalPctInput("buProgramMedicalPct")}
          </div>
        </>
      ) : quickAddSubProgramMode ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[14px] text-[#111827]">BU Program</label>
              <Input
                value={form.watch("buSubProgramBudgetUnitProgramName") || ""}
                disabled
                className="h-[44px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[14px] text-[#111827]">BU Program Code</label>
              <Input
                value={form.watch("buSubProgramBudgetCode") || ""}
                disabled
                className="h-[44px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[14px] text-[#111827]">BU Sub Program</label>
              <Input
                {...form.register("buSubProgramName")}
                placeholder="Enter Name"
                className="h-[44px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[14px] text-[#111827]">BU Sub Program Code</label>
              <Input
                {...form.register("buSubProgramCode")}
                placeholder="Enter Code"
                className="h-[44px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">Description</label>
            <Textarea
              {...form.register("buSubProgramDescription")}
              placeholder="Enter Description"
              className="!h-[70px] resize-none rounded-[9px] border border-[#c5cad5] bg-white px-2.5 py-2 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">Medical Pct</label>
            {renderMedicalPctInput("buSubProgramMedicalPct", "h-[44px]")}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">*Budget Unit Program Name</label>
            {formMode === "edit" ? (
              <Input
                value={form.watch("buSubProgramBudgetUnitProgramName") || ""}
                disabled
                readOnly
                tabIndex={-1}
                placeholder="Select Budget Program"
                className="h-[44px] rounded-[7px] border border-[#c6cedd] px-3 text-[14px] font-normal text-[#111827] shadow-none placeholder:text-[12px] placeholder:text-[#b0b8c8] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100"
              />
            ) : (
              <SingleSelectDropdown
                value={form.watch("buSubProgramBudgetUnitProgramName") ?? ""}
                onChange={(name) => {
                  form.setValue("buSubProgramBudgetUnitProgramName", name, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                  form.setValue("buSubProgramBudgetCode", budgetProgramLookup[name]?.code ?? "", {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                  form.setValue(
                    "buSubProgramDepartment",
                    budgetProgramLookup[name]?.department ?? "",
                    {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    }
                  )
                }}
                onBlur={() => {}}
                options={budgetProgramNameOptions.map((n) => ({ value: n, label: n }))}
                placeholder="Select Budget Program"
                className="!min-h-[44px] h-[44px] !rounded-[7px] !border-[#c6cedd] !px-3 !pr-9 !text-[14px] !font-normal focus-visible:!border-[#6C5DD3] focus-visible:!ring-0"
                itemButtonClassName="rounded-[4px] px-2.5 py-1.5"
                itemLabelClassName="!text-[14px]"
              />
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">*Budget Code</label>
            <Input
              {...form.register("buSubProgramBudgetCode")}
              disabled
              placeholder="Enter Budget Code"
              className="h-[40px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">*Department</label>
            <Input
              {...form.register("buSubProgramDepartment")}
              disabled
              placeholder="Select Department"
              className="h-[40px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[14px] text-[#111827]">*BU Sub Program Code</label>
              <Input
                {...form.register("buSubProgramCode")}
                placeholder="Enter Code"
                className="h-[40px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[14px] text-[#111827]">*BU Sub Program</label>
              <Input
                {...form.register("buSubProgramName")}
                placeholder="Enter Name"
                className="h-[40px] rounded-[9px] border border-[#c5cad5] bg-white px-2.5 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">*Description</label>
            <Textarea
              {...form.register("buSubProgramDescription")}
              placeholder="Enter Description"
              className="!h-[70px] resize-none rounded-[9px] border border-[#c5cad5] bg-white px-2.5 py-2 text-[13px] text-[#111827] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[14px] text-[#111827]">*Medical Pct</label>
            {renderMedicalPctInput("buSubProgramMedicalPct")}
          </div>
        </>
      )}
    </div>
  )
}

