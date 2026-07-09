import { useState } from "react"
import { Check, Plus, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { usePermissions } from "@/hooks/usePermissions"
import type { UserToolbarProps } from "@/features/user/types"

export function UserToolbar({
  inactiveOnly,
  searchTerm,
  suggestions,
  departmentId,
  allowedDepartments,
  onToggleInactiveOnly,
  onSearchChange,
  onSelectSuggestion,
  onDepartmentChange,
  onAddEmployee,
}: UserToolbarProps) {
  const { canAdd } = usePermissions()
  const canAddUser = canAdd("user")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const visibleSuggestions = suggestions.slice(0, 10)
  const shouldShowSuggestions =
    isSearchFocused && searchTerm.trim().length > 0 && visibleSuggestions.length > 0

  return (
    <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
        <div
          className="relative w-full sm:w-[240px]"
          onFocusCapture={() => setIsSearchFocused(true)}
          onBlurCapture={() => setIsSearchFocused(false)}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#a6aaba]" />
          <TitleCaseInput
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search here"
            className={`h-9 w-full rounded-[8px] bg-white pl-9 pr-8 text-[11px]! md:text-[11px]! text-[#232735] shadow-[0_1px_3px_rgba(35,39,53,0.08)] placeholder:text-[11px] placeholder:text-[#b7bccb] focus-visible:ring-0 ${
              isSearchFocused || searchTerm.trim()
                ? "border-[#6C5DD3]"
                : "border-[#e1e4ec]"
            }`}
          />
          {searchTerm.length > 0 && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#232735] cursor-pointer"
              onMouseDown={(event) => {
                event.preventDefault()
              }}
              onClick={() => onSearchChange("")}
            >
              <X className="size-3.5" />
            </button>
          )}
          {shouldShowSuggestions ? (
            <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-full overflow-hidden rounded-[8px] bg-white shadow-[0_6px_16px_rgba(35,39,53,0.16)]">
              {visibleSuggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`flex h-[26px] w-full cursor-pointer items-center px-3 text-left text-[11px] text-[#232735] hover:bg-[#f4f5fa] ${
                    searchTerm.trim().toLowerCase() === name.toLowerCase()
                      ? "bg-[#f4f5fa]"
                      : ""
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelectSuggestion(name)
                    setIsSearchFocused(false)
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="w-full sm:w-[200px]">
          <SingleSelectDropdown
            value={departmentId ?? "all"}
            onChange={(val) => onDepartmentChange(val === "all" ? undefined : val)}
            onBlur={() => {}}
            options={[
              { value: "all", label: "All Departments" },
              ...allowedDepartments.map((dept) => ({
                value: String(dept.id),
                label: dept.name,
              })),
            ]}
            placeholder="All Departments"
            className="h-9! w-full shadow-[0_1px_3px_rgba(35,39,53,0.08)] border-[#e1e4ec]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <Button
          type="button"
          className="flex-1 md:flex-initial h-9 cursor-pointer gap-2 rounded-[12px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#6C5DD3]"
          onClick={onToggleInactiveOnly}
        >
          {inactiveOnly ? (
            <Check className="size-[11px] stroke-3 text-white" />
          ) : (
            <span className="size-[11px] rounded-[2px] bg-white" />
          )}
          Inactive
        </Button>
        {canAddUser && (
          <Button
            type="button"
            className="flex-1 md:flex-initial h-9 cursor-pointer gap-1 rounded-[12px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#6C5DD3]"
            onClick={onAddEmployee}
          >
            <Plus className="size-3.5" />
            Add Employee
          </Button>
        )}
      </div>
    </div>
  )
}

