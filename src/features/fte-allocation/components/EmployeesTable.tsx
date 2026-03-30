import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMemo, useState } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"

import { fteFilterDefaultValues, fteFilterFormSchema } from "../schemas"
import type { EmployeesTableComponentProps, FteFilterFormValues } from "../types"

export function EmployeesTable({
  employees,
  selectedEmployeeId,
  isLoading = false,
  filters,
  onInactiveChange,
  onEmployeeSelect,
}: EmployeesTableComponentProps) {
  const filterForm = useForm<FteFilterFormValues>({
    resolver: zodResolver(fteFilterFormSchema),
    defaultValues: {
      ...fteFilterDefaultValues,
      ...filters,
    },
  })

  // Search popover state
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [tempSearch, setTempSearch] = useState("")

  const showInactive = filterForm.watch("inactive")
  const searchValue = filterForm.watch("search")

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (!showInactive && !emp.active) return false
      if (
        searchValue &&
        !emp.name.toLowerCase().includes(searchValue.toLowerCase())
      )
        return false
      return true
    })
  }, [employees, showInactive, searchValue])

  return (
    <div className="flex flex-col overflow-hidden rounded-[8px] border border-[#E5E7EB]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 bg-[#6C5DD3] px-[12px] py-[13px]">
        <span className="text-[14px] font-[600] text-white">
          Employees
        </span>
        <div className="flex items-center gap-4">
          {/* Inactive toggle */}
          <button
            type="button"
            className="flex items-center gap-[6px]"
            onClick={() => {
              const next = !showInactive
              filterForm.setValue("inactive", next)
              onInactiveChange(next)
            }}
          >
            <Checkbox
              checked={showInactive}
              className="size-[14px] rounded-[4px] border border-white bg-white data-[state=checked]:bg-[#6C5DD3] data-[state=checked]:text-white"
            />
            <span className="text-[14px] font-[400] text-white">
              Inactive
            </span>
          </button>

          {/* Search container */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center justify-center p-0 outline-none"
              onClick={() => setIsSearchOpen((prev) => !prev)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.7422 10.3439C12.5329 9.2673 13 7.9382 13 6.5C13 2.91015 10.0899 0 6.5 0C2.91015 0 0 2.91015 0 6.5C0 10.0899 2.91015 13 6.5 13C7.93858 13 9.26801 12.5327 10.3448 11.7415L10.3439 11.7422C10.3734 11.7822 10.4062 11.8204 10.4424 11.8566L14.2929 15.7071C14.6834 16.0976 15.3166 16.0976 15.7071 15.7071C16.0976 15.3166 16.0976 14.6834 15.7071 14.2929L11.8566 10.4424C11.8204 10.4062 11.7822 10.3734 11.7422 10.3439ZM12 6.5C12 9.53757 9.53757 12 6.5 12C3.46243 12 1 9.53757 1 6.5C1 3.46243 3.46243 1 6.5 1C9.53757 1 12 3.46243 12 6.5Z"
                  fill="white"
                />
              </svg>
            </button>

            {isSearchOpen && (
              <div className="absolute right-0 top-[140%] z-50 flex flex-col gap-3 rounded-[8px] bg-white p-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.15)]">
                <input
                  type="text"
                  placeholder="Search employees"
                  value={tempSearch}
                  onChange={(e) => setTempSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      filterForm.setValue("search", tempSearch)
                      setIsSearchOpen(false)
                    }
                  }}
                  className="w-[200px] rounded-[6px] border border-[#6C5DD3] px-[12px] py-[6px] text-[14px] text-[#1F2937] outline-none focus:ring-1 focus:ring-[#6C5DD3]"
                />
                <div className="flex gap-[8px]">
                  <button
                    type="button"
                    onClick={() => {
                      filterForm.setValue("search", tempSearch)
                      setIsSearchOpen(false)
                    }}
                    className="flex-1 rounded-[6px] bg-[#6C5DD3] px-[12px] py-[6px] text-[14px] font-[500] text-white hover:bg-[#5B4DC5]"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempSearch("")
                      filterForm.setValue("search", "")
                      setIsSearchOpen(false)
                    }}
                    className="flex-1 rounded-[6px] bg-[#6C5DD3] px-[12px] py-[6px] text-[14px] font-[500] text-white hover:bg-[#5B4DC5]"
                  >
                    clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Employee list */}
      <div className="h-[546px] overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="border-b border-[#E5E7EB] p-[12px]">
              <Skeleton className="h-4 w-[70%]" />
            </div>
          ))
        ) : filteredEmployees.length === 0 ? (
          <div className="px-4 py-6 text-center text-[14px] text-[#9CA3AF]">
            No employees found.
          </div>
        ) : (
          filteredEmployees.map((emp) => (
            <button
              key={emp.id}
              type="button"
              onClick={() => onEmployeeSelect(emp.id)}
              className={`w-full border-b border-[#DCDCDC] px-[12px] py-[10px] text-left text-[14px] transition-colors last:border-b-0 ${
                selectedEmployeeId === emp.id
                  ? "bg-white"
                  : "bg-[#FFFFFF66] hover:bg-[#F9FAFB]"
              }`}
            >
              {selectedEmployeeId === emp.id ? (
                <span className="inline-block rounded-[20px] bg-[#A78BFA] px-[10px] py-[4px] font-[500] text-white">
                  {emp.name}
                </span>
              ) : (
                <span className="inline-block px-[10px] py-[4px] font-[400] text-[#1F2937]">
                  {emp.name}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
