import { ChevronDown, ChevronUp } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { BudgetUnitsFormProps } from "../types"

export function BudgetUnitsForm({
  form,
  activeSection,
  formMode,
  quickAddSubProgramMode = false,
  departmentOptions,
  isDepartmentOpen,
  setIsDepartmentOpen,
  departmentDropdownRef,
  budgetUnitNameOptions,
  budgetProgramNameOptions,
  budgetProgramLookup,
  budgetUnitLookup,
  isBuNameOpen,
  setIsBuNameOpen,
  buNameDropdownRef,
  isBudgetProgramOpen,
  setIsBudgetProgramOpen,
  budgetProgramDropdownRef,
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
              <div className="relative" ref={departmentDropdownRef}>
                <Input
                  value={form.watch("budgetUnitDepartment") || ""}
                  readOnly
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setIsDepartmentOpen((prev) => !prev)}
                  onBlur={() => window.setTimeout(() => setIsDepartmentOpen(false), 120)}
                  onFocus={() => setIsDepartmentOpen(true)}
                  placeholder="Select Department"
                  className="h-[44px] rounded-[7px] border border-[#c6cedd] bg-white px-3 pr-8 text-[14px] font-normal text-[#111827] shadow-none placeholder:text-[12px] placeholder:text-[#b0b8c8] focus-visible:border-[#6C5DD3] focus-visible:ring-0"
                />
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setIsDepartmentOpen((prev) => !prev)}
                  className="absolute right-0 top-0 inline-flex h-full w-[24px] cursor-pointer items-center justify-center text-[#6b7280]"
                  aria-label="Toggle department options"
                >
                  {isDepartmentOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </button>
                {isDepartmentOpen ? (
                  <div className="absolute z-10 mt-1 max-h-[180px] w-full overflow-auto rounded-[7px] border border-[#d9deea] bg-white p-1 shadow-[0_8px_18px_rgba(17,24,39,0.12)]">
                    {departmentOptions.map((department) => (
                      <button
                        key={department}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          form.setValue("budgetUnitDepartment", department, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                          setIsDepartmentOpen(false)
                        }}
                        className={`block w-full cursor-pointer rounded-[4px] px-2.5 py-1.5 text-left text-[14px] font-normal text-[#111827] hover:bg-[#e5e7eb] ${
                          form.watch("budgetUnitDepartment") === department ? "bg-[#dbeafe]" : ""
                        }`}
                      >
                        {department}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
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
              <div className="relative" ref={buNameDropdownRef}>
                <Input
                  value={form.watch("buProgramBudgetUnitName") || ""}
                  readOnly
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setIsBuNameOpen((prev) => !prev)}
                  onBlur={() => window.setTimeout(() => setIsBuNameOpen(false), 120)}
                  onFocus={() => setIsBuNameOpen(true)}
                  placeholder="Select Budget Unit"
                  className="h-[44px] rounded-[7px] border border-[#c6cedd] bg-white px-3 pr-8 text-[14px] font-normal text-[#111827] shadow-none placeholder:text-[12px] placeholder:text-[#b0b8c8] focus-visible:border-[#6C5DD3] focus-visible:ring-0"
                />
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setIsBuNameOpen((prev) => !prev)}
                  className="absolute right-0 top-0 inline-flex h-full w-[24px] cursor-pointer items-center justify-center text-[#6b7280]"
                  aria-label="Toggle budget unit options"
                >
                  {isBuNameOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </button>
                {isBuNameOpen ? (
                  <div className="absolute z-10 mt-1 max-h-[180px] w-full overflow-auto rounded-[7px] border border-[#d9deea] bg-white p-1 shadow-[0_8px_18px_rgba(17,24,39,0.12)]">
                    {budgetUnitNameOptions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
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
                          form.setValue(
                            "buProgramDepartment",
                            budgetUnitLookup[name]?.department ?? "",
                            {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            }
                          )
                          setIsBuNameOpen(false)
                        }}
                        className={`block w-full cursor-pointer rounded-[4px] px-2.5 py-1.5 text-left text-[14px] font-normal text-[#111827] hover:bg-[#e5e7eb] ${
                          form.watch("buProgramBudgetUnitName") === name ? "bg-[#dbeafe]" : ""
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
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
              <div className="relative" ref={budgetProgramDropdownRef}>
                <Input
                  value={form.watch("buSubProgramBudgetUnitProgramName") || ""}
                  readOnly
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setIsBudgetProgramOpen((prev) => !prev)}
                  onBlur={() => window.setTimeout(() => setIsBudgetProgramOpen(false), 120)}
                  onFocus={() => setIsBudgetProgramOpen(true)}
                  placeholder="Select Budget Program"
                  className="h-[44px] rounded-[7px] border border-[#c6cedd] bg-white px-3 pr-8 text-[14px] font-normal text-[#111827] shadow-none placeholder:text-[12px] placeholder:text-[#b0b8c8] focus-visible:border-[#6C5DD3] focus-visible:ring-0"
                />
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setIsBudgetProgramOpen((prev) => !prev)}
                  className="absolute right-0 top-0 inline-flex h-full w-[24px] cursor-pointer items-center justify-center text-[#6b7280]"
                  aria-label="Toggle budget program options"
                >
                  {isBudgetProgramOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </button>
                {isBudgetProgramOpen ? (
                  <div className="absolute z-10 mt-1 max-h-[180px] w-full overflow-auto rounded-[7px] border border-[#d9deea] bg-white p-1 shadow-[0_8px_18px_rgba(17,24,39,0.12)]">
                    {budgetProgramNameOptions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          form.setValue("buSubProgramBudgetUnitProgramName", name, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                          form.setValue(
                            "buSubProgramBudgetCode",
                            budgetProgramLookup[name]?.code ?? "",
                            {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            }
                          )
                          form.setValue(
                            "buSubProgramDepartment",
                            budgetProgramLookup[name]?.department ?? "",
                            {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            }
                          )
                          setIsBudgetProgramOpen(false)
                        }}
                        className={`block w-full cursor-pointer rounded-[4px] px-2.5 py-1.5 text-left text-[14px] font-normal text-[#111827] hover:bg-[#e5e7eb] ${
                          form.watch("buSubProgramBudgetUnitProgramName") === name
                            ? "bg-[#dbeafe]"
                            : ""
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
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

