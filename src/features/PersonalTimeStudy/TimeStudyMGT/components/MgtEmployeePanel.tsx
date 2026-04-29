import { useState } from "react"
import { Search, ChevronUp, ChevronDown } from "lucide-react"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import type { MgtEmployeeRow } from "../types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  const [localSearch, setLocalSearch] = useState(search)
  const [isOpen, setIsOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null)

  const handleSearch = () => {
    onSearchChange(localSearch)
    setIsOpen(false)
  }

  const handleClear = () => {
    setLocalSearch("")
    onSearchChange("")
    setIsOpen(false)
  }

  const toggleSort = () => {
    if (sortOrder === null) setSortOrder("asc")
    else if (sortOrder === "asc") setSortOrder("desc")
    else setSortOrder(null)
  }

  const sortedEmployees = [...employees].sort((a, b) => {
    if (!sortOrder) return 0
    const nameA = (a.employee || `${a.firstName ?? ""} ${a.lastName ?? ""}`).trim().toLowerCase()
    const nameB = (b.employee || `${b.firstName ?? ""} ${b.lastName ?? ""}`).trim().toLowerCase()
    
    if (sortOrder === "asc") return nameA.localeCompare(nameB)
    return nameB.localeCompare(nameA)
  })

  return (
    <TooltipProvider>
      <div className="flex w-[420px] shrink-0 flex-col rounded-[6px] bg-white shadow-[0_4px_16px_rgba(16,24,40,0.12)] overflow-hidden">
        {/* Purple header */}
        <div className="flex h-[52px] items-center justify-between bg-[#6C5DD3] px-3 py-2">
          <div className="flex-1 h-full pr-2">
            <Tooltip open={tooltipOpen}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleSort}
                  onMouseEnter={() => setTooltipOpen(true)}
                  onMouseLeave={() => setTooltipOpen(false)}
                  onFocus={() => setTooltipOpen(true)}
                  onBlur={() => setTooltipOpen(false)}
                  className="relative flex h-full w-full cursor-pointer items-center justify-start pr-5 text-left text-sm font-normal text-white"
                >
                  <span>Employee Name</span>
                  <span className="pointer-events-none absolute right-0 inline-flex flex-col items-center leading-none">
                    <ChevronUp
                      className={`size-[10px] ${
                        sortOrder === "asc" ? "text-white" : "text-white/50"
                      }`}
                    />
                    <ChevronDown
                      className={`-mt-1 size-[10px] ${
                        sortOrder === "desc" ? "text-white" : "text-white/50"
                      }`}
                    />
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6}>
                {sortOrder === "desc" ? "Click to cancel sorting" : sortOrder === "asc" ? "Click to sort descending" : "Click to sort ascending"}
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-1.5">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <button className="text-white opacity-80 hover:opacity-100">
                <Search className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-3" align="end">
              <div className="flex flex-col gap-3">
                <Input
                  placeholder="Search name"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="h-7 flex-1 bg-[#6C5DD3] hover:opacity-90 text-[11px]"
                    onClick={handleSearch}
                  >
                    Search
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-7 flex-1 bg-[#6C5DD3] hover:bg-[#5a4bb8] text-white text-[11px]"
                    onClick={handleClear}
                  >
                    clear
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Scrollable list — fixed height so panel never shrinks */}
      <div className="overflow-y-auto divide-y divide-gray-200 h-[430px]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <img src={tableEmptyIcon} alt="" className="size-[80px] object-contain" />
          </div>
        ) : employees.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <img src={tableEmptyIcon} alt="" className="size-[80px] object-contain" />
          </div>
        ) : (
          sortedEmployees.map((emp) => (
            <button
              key={emp.id}
              id={`mgt-employee-${emp.id}`}
              onClick={() => onSelect(emp)}
              className={`w-full cursor-pointer pl-3 pr-4 py-2.5 text-left text-[14px] transition-colors ${
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

      {/* Bottom spacing reduced */}
      <div className="h-2 bg-white shrink-0" />
    </div>
    </TooltipProvider>
  )
}
