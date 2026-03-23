import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useFormContext } from "react-hook-form"

import { Input } from "@/components/ui/input"
import { type UserModuleFormValues } from "@/features/user/types"
import { cn } from "@/lib/utils"

const departmentOptions = ["Public Health", "Behavioral Health", "Social Services"]

export function TimeStudyAssignmentsPanel() {
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false)
  const departmentDropdownRef = useRef<HTMLDivElement | null>(null)
  const { register, watch, setValue } = useFormContext<UserModuleFormValues>()
  const employeeName = `${watch("firstName") ?? ""} ${watch("lastName") ?? ""}`.trim()
  const department = watch("claimingUnit") || "Public Health"
  const options = useMemo(() => departmentOptions, [])
  const matchedTextClass = "!text-[11px] !leading-[16px] font-normal"
  const labelClassName = "mb-1 block select-none text-[11px] font-medium text-[#2a2f3a]"
  const inputClassName =
    `h-[46px] rounded-[7px] border border-[#c6cedd] bg-white px-3 pr-8 ${matchedTextClass} text-[#111827] shadow-none placeholder:!text-[11px] placeholder:!leading-[16px] placeholder:font-normal placeholder:text-[#c2c7d3] focus-visible:border-[#cfc6ff] focus-visible:ring-0`

  useEffect(() => {
    if (!isDepartmentOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!departmentDropdownRef.current?.contains(target)) {
        setIsDepartmentOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
    }
  }, [isDepartmentOpen])

  return (
    <div className="pt-2">
      <p className="mb-4 select-none text-[12px] font-semibold uppercase text-[#111827]">{employeeName}</p>
      <div className="flex items-end justify-between gap-6">
        <div className="w-full max-w-[306px]">
          <label className={`${labelClassName} cursor-pointer`} onClick={() => setIsDepartmentOpen(true)}>
            Department
          </label>
          <div ref={departmentDropdownRef} className="group/selector relative">
            <Input
              value={department}
              readOnly
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsDepartmentOpen((prev) => !prev)}
              onFocus={() => setIsDepartmentOpen(true)}
              onBlur={() => window.setTimeout(() => setIsDepartmentOpen(false), 120)}
              className={cn(
                inputClassName,
                "cursor-pointer select-none caret-transparent",
                isDepartmentOpen ? "border-[#3b82f6] ring-1 ring-[#3b82f640]" : ""
              )}
            />
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsDepartmentOpen((prev) => !prev)}
              className="absolute right-0 top-0 inline-flex h-full w-[20px] cursor-pointer items-center justify-center text-[#6b7280]"
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
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setValue("claimingUnit", option)
                      setIsDepartmentOpen(false)
                    }}
                    className={cn(
                      `block w-full cursor-pointer rounded-[5px] px-2.5 py-1.5 text-left ${matchedTextClass} text-[#111827] hover:bg-[#edf5ff]`,
                      department === option ? "bg-[#dbeafe] font-normal" : ""
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="select-none text-[11px] font-medium text-[#2a2f3a]">TS Minutes/Day</label>
          <div className="flex h-[46px] items-center rounded-[7px] border border-[#d2d8e3] bg-white px-3">
            <Input
              {...register("tsMinDay")}
              className="h-auto w-[70px] border-0 bg-transparent p-0 text-[12px] text-[#111827] shadow-none focus-visible:ring-0"
              placeholder="480"
            />
            <span className="ml-6 select-none text-[11px] text-[#2a2f3a]">Min/Day</span>
          </div>
        </div>
      </div>
    </div>
  )
}
