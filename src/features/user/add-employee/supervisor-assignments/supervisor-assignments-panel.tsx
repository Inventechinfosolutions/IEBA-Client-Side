import { useMemo, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { ChevronDown, ChevronUp } from "lucide-react"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import type { UserModuleFormValues, SupervisorDropdownFieldProps } from "../types"

import { useGetEmployees } from "../queries/get-add-employee"

function SupervisorDropdownField({ name, label, options }: SupervisorDropdownFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { control } = useFormContext<UserModuleFormValues>()
  const inputTextClass = "!text-[11px] !leading-[14px] font-normal"
  const optionTextClass = "text-[11px] leading-[16px] font-normal"
  const inputClassName =
    `h-[46px] rounded-[7px] border border-[#c6cedd] bg-white px-3 pr-8 ${inputTextClass} text-[#111827] shadow-none placeholder:!text-[9.5px] placeholder:!leading-[14px] placeholder:font-normal placeholder:text-[#c2c7d3] focus-visible:border-[#6C5DD3] focus-visible:ring-0`

  const selectedOptionClass = "bg-[#dbeafe] font-normal"

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <label
            className="mb-0.5 block cursor-pointer select-none text-[10px] font-medium text-[#2a2f3a]"
            onClick={() => setIsOpen(true)}
          >
            {label}
          </label>
          <div className="group/selector relative">
            <Input
              value={field.value ?? ""}
              readOnly
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsOpen((prev) => !prev)}
              onBlur={() => {
                field.onBlur()
                window.setTimeout(() => setIsOpen(false), 120)
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={`Select ${label}`}
              className={cn(
                inputClassName,
                "cursor-pointer select-none caret-transparent",
                field.value ? "text-[#111827]" : "",
                isOpen ? "border-[#3b82f6] ring-1 ring-[#3b82f640]" : "",
              )}
            />
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsOpen((prev) => !prev)}
              className="absolute right-0 top-0 inline-flex h-full w-[20px] cursor-pointer items-center justify-center text-[#6b7280]"
              aria-label={`Toggle ${label} options`}
            >
              {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {isOpen ? (
              <div className="absolute z-10 mt-1 max-h-[180px] w-full overflow-auto rounded-[7px] border border-[#d9deea] bg-white p-1 shadow-[0_8px_18px_rgba(17,24,39,0.12)]">
                {options.length > 0 ? (
                  options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        field.onChange(option)
                        setIsOpen(false)
                      }}
                      className={cn(
                        `block w-full cursor-pointer rounded-[4px] px-2.5 py-1.5 text-left ${optionTextClass} text-[#111827] hover:bg-[#e5e7eb]`,
                        field.value === option ? selectedOptionClass : "",
                      )}
                    >
                      {option}
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-[6px] border border-[#eceff5] bg-white px-3 py-4">
                    <img
                      src={tableEmptyIcon}
                      alt=""
                      className="h-[73px] w-[82px] object-contain"
                    />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    />
  )
}

/** UI tab: Supervisor Assignments */
export function SupervisorAssignmentsPanel() {
  const employeesQuery = useGetEmployees({ page: 1, pageSize: 100, inactiveOnly: false })
  const { watch } = useFormContext<UserModuleFormValues>()
  const employeeName = `${watch("firstName") ?? ""} ${watch("lastName") ?? ""}`.trim()

  const supervisorOptions = useMemo(() => {
    const rows = employeesQuery.data?.items ?? []
    const names = rows
      .map((r) => r.employee.trim())
      .filter((n) => n.length > 0)
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  }, [employeesQuery.data?.items])

  return (
    <div className="pt-1">
      <p className="mb-5 select-none text-[12px] font-semibold uppercase text-[#111827]">{employeeName}</p>
      <div className="grid max-w-[620px] grid-cols-2 gap-2 pt-2">
        <SupervisorDropdownField
          name="supervisorPrimary"
          label="Primary Supervisor"
          options={supervisorOptions}
        />
        <SupervisorDropdownField
          name="supervisorSecondary"
          label="Backup Supervisor"
          options={supervisorOptions}
        />
      </div>
    </div>
  )
}
