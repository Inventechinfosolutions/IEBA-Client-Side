import { Search } from "lucide-react"
import type { MgtEmployeeRow } from "../types"

type MgtEmployeePanelProps = {
  search: string
  onSearchChange: (value: string) => void
  employees: MgtEmployeeRow[]
  selectedUserId: string | null
  onSelect: (employee: MgtEmployeeRow) => void
  isLoading: boolean
}

export function MgtEmployeePanel({
  search,
  onSearchChange,
  employees,
  selectedUserId,
  onSelect,
  isLoading,
}: MgtEmployeePanelProps) {
  return (
    <div className="flex w-[260px] shrink-0 flex-col rounded-[8px] bg-white shadow-[0_4px_16px_rgba(16,24,40,0.12)] overflow-hidden">
      {/* Purple header */}
      <div className="flex items-center justify-between bg-[#6B4EFF] px-3 py-2">
        <span className="text-sm font-semibold text-white">Employee Name</span>
        <div className="flex items-center gap-1.5">
          <button className="text-white opacity-80 hover:opacity-100">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
          <Search className="h-4 w-4 text-white opacity-80" />
        </div>
      </div>

      {/* Search input */}
      <div className="border-b border-gray-100 px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1">
          <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <input
            id="mgt-employee-search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search employee..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-[500px]">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-xs text-gray-400">Loading...</div>
        ) : employees.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-gray-400">No employees found</div>
        ) : (
          employees.map((emp) => (
            <button
              key={emp.id}
              id={`mgt-employee-${emp.id}`}
              onClick={() => onSelect(emp)}
              className={`w-full px-4 py-2.5 text-left text-xs transition-colors ${
                selectedUserId === emp.id
                  ? "bg-purple-50 font-semibold text-[#6B4EFF]"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {emp.employee || `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.id}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
