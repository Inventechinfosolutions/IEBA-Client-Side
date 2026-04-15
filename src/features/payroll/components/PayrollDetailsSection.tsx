import type { ReactNode } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SingleSelectDropdown, type SingleSelectOption } from "@/components/ui/dropdown"
import { Label } from "@/components/ui/label"
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

import { payrollDetailsFormSchema } from "../schemas"
import { PAYROLL_FREQUENCY_OPTIONS } from "../enums/payrollFrequency"
import type { DepartmentUser, PayrollDetailsFormValues, PayrollDetailsSectionProps, PayrollPeriodType } from "../types"
import { buildPayrollDetailsDefaultValues, mapPayrollDetailsFormToQueryParams } from "../utils/payrollForm"
import { useGetDepartmentUsers } from "../queries/getDepartmentUsers"

const sectionCardShadowClass = "shadow-[0_4px_16px_rgba(16,24,40,0.12)]"

const PAYROLL_TYPE_OPTIONS = PAYROLL_FREQUENCY_OPTIONS as { value: PayrollDetailsFormValues["payrollType"]; label: string }[]

function RadioChoice({
  value,
  label,
  selected,
  id,
  disabled = false,
}: {
  value: string
  label: string
  selected: boolean
  id: string
  disabled?: boolean
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-center gap-2 text-[12px] text-[#111827]",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        !selected && "opacity-80",
      )}
    >
      <RadioGroupItem value={value} id={id} className="border-[#d6d7dc]" disabled={disabled} />
      <span>{label}</span>
    </label>
  )
}

function PurpleFieldLabel({
  htmlFor,
  required: isRequired,
  children,
}: {
  htmlFor?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="mb-2 block text-[12px] font-medium text-(--primary)"
    >
      {isRequired ? <span aria-hidden>*</span> : null}
      {children}
    </Label>
  )
}

export function PayrollDetailsSection({
  filterOptions,
  isOptionsLoading,
  isRowsLoading,
  settingsPayrollType,
  isPayrollTypeLocked = false,
  onGetRows,
  onDownloadCurrentRows,
  onDelete,
  activeQueryParams,
}: PayrollDetailsSectionProps) {
  const detailsFormValues = buildPayrollDetailsDefaultValues(filterOptions, settingsPayrollType)

  const form = useForm<PayrollDetailsFormValues>({
    resolver: zodResolver(payrollDetailsFormSchema),
    values: detailsFormValues,
    mode: "onSubmit",
    resetOptions: {
      keepDirtyValues: true,
    },
  })

  const periodType = useWatch({ control: form.control, name: "periodType" })
  const departmentId = useWatch({ control: form.control, name: "departmentId" })
  const fiscalYearId = useWatch({ control: form.control, name: "fiscalYearId" })

  const { data: departmentUsers = [], isLoading: isUsersLoading } = useGetDepartmentUsers(departmentId, fiscalYearId)

  const periodValueOptions: readonly SingleSelectOption[] =
    periodType === "month" ? filterOptions.monthOptions : filterOptions.quarterOptions

  const fiscalYearOptions: SingleSelectOption[] = [...filterOptions.fiscalYears]
  const departmentOptions: SingleSelectOption[] = [...filterOptions.departments]
  const employeeOptions: SingleSelectOption[] = (departmentUsers as DepartmentUser[]).map((u) => ({
    value: String(u.employeeId || u.id),
    label: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || String(u.employeeId || u.id),
  }))

  const handleGetSubmit = form.handleSubmit((values) => {
    onGetRows(mapPayrollDetailsFormToQueryParams(values, filterOptions))
  })

  const handleDeleteClick = () => {
    if (activeQueryParams === null) return
    onDelete(activeQueryParams)
  }

  return (
    <div className="min-w-0 max-w-full">
      <Card
        className={`min-w-0 max-w-full gap-0 overflow-visible rounded-[8px] border-0 bg-white py-0 ring-0 ${sectionCardShadowClass}`}
      >
        <CardContent className="min-w-0 max-w-full space-y-5 px-5 py-5">
        <div>
          <PurpleFieldLabel required>Payroll Type:</PurpleFieldLabel>
          <Controller
            name="payrollType"
            control={form.control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={isPayrollTypeLocked ? undefined : field.onChange}
                className={cn(
                  "flex flex-wrap gap-x-6 gap-y-2",
                  isPayrollTypeLocked && "cursor-not-allowed",
                )}
              >
                {PAYROLL_TYPE_OPTIONS.map((opt) => (
                  <RadioChoice
                    key={opt.value}
                    id={`payroll-type-${opt.value}`}
                    value={opt.value}
                    label={opt.label}
                    selected={field.value === opt.value}
                    disabled={isPayrollTypeLocked}
                  />
                ))}
              </RadioGroup>
            )}
          />
          {form.formState.errors.payrollType ? (
            <p className="mt-1 text-[11px] text-destructive">{form.formState.errors.payrollType.message}</p>
          ) : null}
        </div>

        <div className="flex min-w-0 max-w-full flex-wrap items-start gap-6">
          <div className="w-[min(100%,200px)] shrink-0 sm:w-[200px]">
            <PurpleFieldLabel required>Fiscal Year:</PurpleFieldLabel>
            <Controller
              name="fiscalYearId"
              control={form.control}
              render={({ field }) => (
                <SingleSelectDropdown
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val)
                    form.setValue("employeeIdsSerialized", "")
                  }}
                  onBlur={field.onBlur}
                  options={fiscalYearOptions}
                  placeholder="Fiscal year"
                  disabled={isOptionsLoading}
                  isLoading={isOptionsLoading}
                  className="h-[46px]! min-h-[46px]! w-full rounded-[6px]! border-[#d6d7dc]! text-[14px]!"
                  itemButtonClassName="rounded-[6px] px-3 py-2"
                  itemLabelClassName="!text-[14px]"
                />
              )}
            />
            {form.formState.errors.fiscalYearId ? (
              <p className="mt-1 text-[11px] text-destructive">
                {form.formState.errors.fiscalYearId.message}
              </p>
            ) : null}
          </div>

          <div>
            <PurpleFieldLabel required>Period:</PurpleFieldLabel>
            <Controller
              name="periodType"
              control={form.control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={(next) => {
                    const typed = next as PayrollPeriodType
                    field.onChange(typed)
                    const opts = typed === "month" ? filterOptions.monthOptions : filterOptions.quarterOptions
                    form.setValue("monthOrQuarterId", opts[0]?.value ?? "", { shouldValidate: true })
                  }}
                  className="flex flex-wrap gap-x-6 gap-y-2"
                >
                  <RadioChoice
                    id="period-month"
                    value="month"
                    label="Month"
                    selected={field.value === "month"}
                  />
                  <RadioChoice
                    id="period-quarterly"
                    value="quarterly"
                    label="Quarterly"
                    selected={field.value === "quarterly"}
                  />
                </RadioGroup>
              )}
            />
          </div>

          <div className="w-[min(100%,200px)] shrink-0 sm:w-[200px]">
            <PurpleFieldLabel required>
              {periodType === "month" ? "Month:" : "Quarter:"}
            </PurpleFieldLabel>
            <Controller
              name="monthOrQuarterId"
              control={form.control}
              render={({ field }) => (
                <SingleSelectDropdown
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={[...periodValueOptions]}
                  placeholder={periodType === "month" ? "Month" : "Quarter"}
                  disabled={isOptionsLoading}
                  isLoading={isOptionsLoading}
                  className="h-[46px]! min-h-[46px]! w-full rounded-[6px]! border-[#d6d7dc]! text-[14px]!"
                  itemButtonClassName="rounded-[6px] px-3 py-2"
                  itemLabelClassName="!text-[14px]"
                />
              )}
            />
            {form.formState.errors.monthOrQuarterId ? (
              <p className="mt-1 text-[11px] text-destructive">
                {form.formState.errors.monthOrQuarterId.message}
              </p>
            ) : null}
          </div>

          <div className="w-full min-w-0 shrink-0 sm:w-[min(100%,280px)]">
            <PurpleFieldLabel>Department:</PurpleFieldLabel>
            <Controller
              name="departmentId"
              control={form.control}
              render={({ field }) => (
                <SingleSelectDropdown
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val)
                    form.setValue("employeeIdsSerialized", "")
                  }}
                  onBlur={field.onBlur}
                  options={departmentOptions}
                  placeholder="Department"
                  disabled={isOptionsLoading}
                  isLoading={isOptionsLoading}
                  className="h-[46px]! min-h-[46px]! w-full rounded-[6px]! border-[#d6d7dc]! text-[14px]!"
                  itemButtonClassName="rounded-[6px] px-3 py-2"
                  itemLabelClassName="!text-[14px]"
                />
              )}
            />
            {form.formState.errors.departmentId ? (
              <p className="mt-1 text-[11px] text-destructive">
                {form.formState.errors.departmentId.message}
              </p>
            ) : null}
          </div>

          <div className="w-full min-w-0 shrink-0 sm:w-[min(100%,280px)]">
            <PurpleFieldLabel>Employees:</PurpleFieldLabel>
            <Controller
              name="employeeIdsSerialized"
              control={form.control}
              render={({ field }) => (
                <MultiSelectDropdown
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={employeeOptions}
                  placeholder="Employee"
                  disabled={isOptionsLoading || isUsersLoading}
                  isLoading={isOptionsLoading || isUsersLoading}
                  maxVisibleItems={2}
                  className="min-h-[46px] w-full rounded-[6px] border-[#d6d7dc] text-[14px]"
                />
              )}
            />
          </div>
        </div>

        <div className="flex min-w-0 max-w-full flex-row flex-wrap items-center justify-start gap-3">
          <Button
            type="button"
            disabled={isRowsLoading}
            onClick={handleGetSubmit}
            className="h-[44px] min-w-[100px] rounded-[8px] border-0 bg-(--primary) px-8 text-[12px] font-medium text-white hover:bg-(--primary) disabled:opacity-70"
          >
            Get
          </Button>
          <Button
            type="button"
            onClick={onDownloadCurrentRows}
            className="h-[44px] min-w-[120px] rounded-[8px] border-0 bg-(--primary) px-6 text-[12px] font-medium text-white hover:bg-(--primary)/90"
          >
            Download
          </Button>
          <Button
            type="button"
            disabled={activeQueryParams === null}
            onClick={handleDeleteClick}
            className="h-[44px] min-w-[100px] rounded-[8px] border-0 bg-[#ef4444] px-6 text-[12px] font-medium text-white hover:bg-[#dc2626] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#ef4444] disabled:opacity-100 disabled:hover:bg-[#ef4444]"
          >
            Delete
          </Button>
        </div>
        </CardContent>
      </Card>
    </div>
  )
}
