import { useState, useMemo } from "react"
import { ArrowLeft, History, User, Phone, Mail, MapPin, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"

import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  type DepartmentContactCellProps,
  type DepartmentTableProps,
  type SortColumn,
  type SortDirection,
} from "../types"
import statusCheckImg from "@/assets/status-check.png"
import statusCrossImg from "@/assets/status-cross.png"
import editIconImg from "@/assets/edit-icon.png"
import { usePermissions } from "@/hooks/usePermissions"
import { DepartmentHistoryTable } from "./DepartmentHistoryTable"



const ContactInfo = ({
  contactId,
  contact,
  resolved,
}: DepartmentContactCellProps) => {
  const hasId = !!contactId?.trim()
  const effective = resolved ?? contact
  const hasDisplay =
    !!effective &&
    (effective.name ?? "").trim() !== "" &&
    effective.name !== "Not Assigned"

  const contactRowClass = "flex items-center gap-[6px] py-[1px] leading-tight"
  const contactDividerClass = "border-t border-[#E5E7EB]"

  if (!hasDisplay && !hasId) {
    return (
      <div className="flex w-full flex-col text-[13px] text-[#111827]">
        <div className={contactRowClass}>
          <User className="h-[14px] w-[14px] shrink-0 text-[#6C5DD3]" />
          <span>Not Assigned</span>
        </div>
        <div className={`${contactRowClass} ${contactDividerClass}`}>
          <Phone className="h-[14px] w-[14px] shrink-0 text-[#6C5DD3]" />
        </div>
        <div className={`${contactRowClass} ${contactDividerClass}`}>
          <Mail className="h-[14px] w-[14px] shrink-0 text-[#6C5DD3]" />
        </div>
        <div className={`${contactRowClass} ${contactDividerClass}`}>
          <MapPin className="h-[14px] w-[14px] shrink-0 text-[#6C5DD3]" />
        </div>
      </div>
    )
  }

  if (hasId && !hasDisplay) {
    return (
      <div className="flex w-full flex-col text-[13px] text-[#111827]">
        <div className={contactRowClass}>
          <User className="h-[14px] w-[14px] shrink-0 text-[#6C5DD3]" />
          <span className="text-[#6B7280]">Contact assigned</span>
        </div>
        <div className={`${contactRowClass} ${contactDividerClass}`}>
          <Phone className="h-[14px] w-[14px] shrink-0 text-[#6C5DD3]" />
        </div>
        <div className={`${contactRowClass} ${contactDividerClass}`}>
          <Mail className="h-[14px] w-[14px] shrink-0 text-[#6C5DD3]" />
        </div>
        <div className={`${contactRowClass} ${contactDividerClass}`}>
          <MapPin className="h-[14px] w-[14px] shrink-0 text-[#6C5DD3]" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-full flex-col text-[13px] text-[#111827] min-w-0 overflow-hidden">
      <div className={contactRowClass}>
        <User className="h-[14px] w-[14px] shrink-0 text-[#6C5DD3]" />
        <span>{effective!.name}</span>
      </div>
      <div className={`${contactRowClass} ${contactDividerClass}`}>
        <Phone className="h-[14px] w-[14px] shrink-0 text-[#6C5DD3]" />
        <span className="text-[#6C5DD3]">{effective!.phone || ""}</span>
      </div>
      <div className="flex items-start gap-[6px] py-[1px] leading-tight border-t border-[#E5E7EB] w-full min-w-0 overflow-hidden">
        <Mail className="h-[14px] w-[14px] shrink-0 text-[#6C5DD3] mt-0.5" />
        {effective!.email ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span 
                  style={{ wordBreak: "break-all", whiteSpace: "normal" }}
                  className="block w-full min-w-0 cursor-pointer text-[12px] font-medium text-[#6C5DD3]"
                >
                  {effective!.email}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="rounded-[8px] border-0 bg-[#222222] px-3 py-2 text-[14px] font-medium text-white shadow-lg"
                sideOffset={4}
              >
                {effective!.email}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="wrap-break-word text-[12px] text-[#6C5DD3]">{""}</span>
        )}
      </div>
      <div className={`${contactRowClass} ${contactDividerClass}`}>
        <MapPin className="h-[14px] w-[14px] shrink-0 text-[#6C5DD3]" />
        <span className="text-[#6C5DD3]">{effective!.location || ""}</span>
      </div>
    </div>
  )
}

export function DepartmentTable({
  departments,
  totalItems,
  isLoading,
  pagination,
  filters,
  onSearchChange,
  onInactiveChange,
  onPageChange,
  onPageSizeChange,
  onAdd,
  onEdit,
}: DepartmentTableProps) {
  const { isSuperAdmin, canAdd, canUpdate, canView } = usePermissions()
  const canUpdateDepartment = isSuperAdmin || canUpdate("department")
  const canViewDepartment = isSuperAdmin || canView("department")
  const canAddDepartment = isSuperAdmin || canAdd("department")
  const showActionColumn = canUpdateDepartment || canViewDepartment
  const tableColumnCount = canUpdateDepartment ? 10 : showActionColumn ? 7 : 6

  const usersById = useMemo(() => new Map<string, any>(), [])

  const [sortBy, setSortBy] = useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [isSortTooltipOpen, setIsSortTooltipOpen] = useState(false)
  const [sortTooltipColumn, setSortTooltipColumn] = useState<SortColumn>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [historyDepartmentCode, setHistoryDepartmentCode] = useState("")
  const [historyDepartmentName, setHistoryDepartmentName] = useState("")
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [historyDepartment, setHistoryDepartment] = useState<{
    id: string
    code: string
    name: string
  } | null>(null)

  function handleHistoryRow(dept: { id: string; code: string; name: string }) {
    setHistoryDepartment(dept)
    setHistoryDialogOpen(true)
  }

  function handleHistoryDialogOpenChange(open: boolean) {
    setHistoryDialogOpen(open)
    if (!open) setHistoryDepartment(null)
  }

  const sortedDepartments = useMemo(() => {
    if (!sortBy || !sortDirection) return departments
    const direction = sortDirection === "asc" ? 1 : -1
    return [...departments].sort((a, b) =>
      a[sortBy].localeCompare(b[sortBy], undefined, { sensitivity: "base" }) * direction
    )
  }, [departments, sortBy, sortDirection])

  const getSortTooltip = (column: SortColumn): string => {
    if (sortBy !== column) return "Click to sort ascending"
    if (sortDirection === "asc") return "Click to sort descending"
    if (sortDirection === "desc") return "Click to cancel sorting"
    return "Click to sort ascending"
  }

  const handleSortToggle = (column: SortColumn) => {
    if (sortBy !== column) {
      setSortBy(column)
      setSortDirection("asc")
      return
    }
    if (sortDirection === "asc") {
      setSortDirection("desc")
      return
    }
    if (sortDirection === "desc") {
      setSortBy(null)
      setSortDirection(null)
      return
    }
    setSortDirection("asc")
  }


  return (
    <div className="flex flex-1 flex-col gap-[24px]">
  
      <div className="flex items-center justify-between">
        {showHistory ? (
          <div className="flex flex-1 items-center gap-2">
            <TitleCaseInput
              placeholder="Search Department Code"
              value={historyDepartmentCode}
              onChange={(e) => setHistoryDepartmentCode(e.target.value)}
              className="h-[48px] w-[220px] rounded-[8px] border-[#E5E7EB] bg-white px-[15px] py-[12px] text-[14px] shadow-sm focus-visible:ring-1 focus-visible:ring-[#6C5DD3]"
            />
            <TitleCaseInput
              placeholder="Search Department Name"
              value={historyDepartmentName}
              onChange={(e) => setHistoryDepartmentName(e.target.value)}
              className="h-[48px] w-[260px] rounded-[8px] border-[#E5E7EB] bg-white px-[15px] py-[12px] text-[14px] shadow-sm focus-visible:ring-1 focus-visible:ring-[#6C5DD3]"
            />
          </div>
        ) : (
          <div className="relative w-[300px]">
            <TitleCaseInput
              value={filters.search || ""}
              onChange={(e) => {
                onSearchChange(e.target.value)
                onPageChange(1)
                setSortBy(null)
                setSortDirection(null)
              }}
              placeholder="Search here"
              className="h-[48px] w-full rounded-[8px] border-[#E5E7EB] bg-white pl-[15px] pr-[35px] py-[12px] text-[14px] shadow-sm focus-visible:ring-1 focus-visible:ring-[#6C5DD3]"
            />
            {(filters.search || "").length > 0 && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#111827] cursor-pointer"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSearchChange("")
                  onPageChange(1)
                  setSortBy(null)
                  setSortDirection(null)
                }}
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-[12px]">
          <button
            type="button"
            className={`flex h-[48px] items-center gap-2 rounded-[10px] px-4 text-[14px] font-medium transition-colors ${
              showHistory
                ? "bg-[#6C5DD3] text-white"
                : "border border-[#6C5DD3] bg-white text-[#6C5DD3] hover:bg-[#F3F0FF]"
            }`}
            onClick={() => {
              setShowHistory((prev) => {
                if (prev) {
                  setHistoryDepartmentCode("")
                  setHistoryDepartmentName("")
                } else {
                  onSearchChange("")
                  onPageChange(1)
                  setSortBy(null)
                  setSortDirection(null)
                }
                return !prev
              })
            }}
          >
            {showHistory ? (
              <>
                <ArrowLeft className="size-4 animate-back-bounce" />
                Back to Department
              </>
            ) : (
              <>
                <History className="size-4" />
                History
              </>
            )}
          </button>

          {!showHistory && (
            <button
              type="button"
              className="flex h-[48px] items-center gap-2 rounded-[10px] bg-[#6C5DD3] px-4 text-white"
              onClick={() => {
                onInactiveChange(!filters.inactive)
                onPageChange(1)
                setSortBy(null)
                setSortDirection(null)
              }}
            >
              <Checkbox
                checked={filters.inactive}
                className="size-5 rounded-[6px] border-white bg-white data-[state=checked]:border-white data-[state=checked]:bg-[#6C5DD3] data-[state=checked]:text-white shadow-none"
              />
              <span className="text-[14px] font-medium text-white select-none whitespace-nowrap">
                Inactive
              </span>
            </button>
          )}

          {!showHistory && canAddDepartment && (
            <Button
              onClick={onAdd}
              className="h-[48px] rounded-[8px] bg-[#6C5DD3] px-[20px] text-[14px] font-medium hover:bg-[#5B4DC5]"
            >
              <span className="mr-2 text-[18px]">+</span> Add Department
            </Button>
          )}
        </div>
      </div>

      {showHistory ? (
        <DepartmentHistoryTable
          departmentCode={historyDepartmentCode}
          departmentName={historyDepartmentName}
        />
      ) : null}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div
        className={`overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white ${
          showHistory ? "hidden" : ""
        }`}
      >
        <Table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className={canUpdateDepartment ? "w-[7%]" : "w-[18%]"} /> { /* Code */ }
            <col className={canUpdateDepartment ? "w-[9%]" : "w-[20%]"} /> { /* Name/Department */ }
            <col className={canUpdateDepartment ? "w-[8%]" : "w-[20%]"} /> { /* Address */ }
            {canUpdateDepartment && (
              <>
                <col className="w-[15%]" /> { /* Primary Contact */ }
                <col className="w-[15%]" /> { /* Secondary Contact */ }
                <col className="w-[15%]" /> { /* Billing Contact */ }
              </>
            )}
            <col className={canUpdateDepartment ? "w-[7%]" : "w-[15%]"} /> { /* Allow Multi */ }
            <col className={canUpdateDepartment ? "w-[5%]" : "w-[12%]"} /> { /* Multi Codes */ }
            <col className={canUpdateDepartment ? "w-[5%]" : "w-[15%]"} /> { /* Active */ }
            {showActionColumn && <col className="w-[5%]" />} { /* Action */ }
          </colgroup>
          <TableHeader>
            <TableRow className="bg-[#6C5DD3] hover:bg-[#6C5DD3] h-[56px]">
              <TableHead className="border-r border-[#FFFFFF66] p-[8px] align-middle text-center text-[14px] font-medium text-white">
                <TooltipProvider>
                  <Tooltip open={isSortTooltipOpen && sortTooltipColumn === "code"}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          setSortTooltipColumn("code")
                          setIsSortTooltipOpen(true)
                          handleSortToggle("code")
                        }}
                        onMouseEnter={() => {
                          setSortTooltipColumn("code")
                          setIsSortTooltipOpen(true)
                        }}
                        onMouseLeave={() => setIsSortTooltipOpen(false)}
                        onFocus={() => {
                          setSortTooltipColumn("code")
                          setIsSortTooltipOpen(true)
                        }}
                        onBlur={() => setIsSortTooltipOpen(false)}
                        className="mx-auto flex h-full max-w-full cursor-pointer items-center justify-center gap-2 font-medium"
                      >
                        <span className="whitespace-nowrap font-medium">Code</span>
                        <span className="inline-flex shrink-0 flex-col">
                          <span
                            className={`h-0 w-0 border-b-[4px] border-l-3 border-r-3 border-l-transparent border-r-transparent ${
                              sortBy === "code" && sortDirection === "asc"
                                ? "border-b-[#1E8BFF]"
                                : "border-b-white/60"
                            }`}
                          />
                          <span
                            className={`mt-0.5 h-0 w-0 border-l-3 border-r-3 border-t-[4px] border-l-transparent border-r-transparent ${
                              sortBy === "code" && sortDirection === "desc"
                                ? "border-t-[#201547]"
                                : "border-t-white"
                            }`}
                          />
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="rounded-[10px] bg-black px-3.5 py-2.5 text-[13px] font-medium text-white">
                      {getSortTooltip("code")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="border-r border-[#FFFFFF66] p-[8px] align-middle text-center text-[14px] font-medium text-white">
                <TooltipProvider>
                  <Tooltip open={isSortTooltipOpen && sortTooltipColumn === "name"}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          setSortTooltipColumn("name")
                          setIsSortTooltipOpen(true)
                          handleSortToggle("name")
                        }}
                        onMouseEnter={() => {
                          setSortTooltipColumn("name")
                          setIsSortTooltipOpen(true)
                        }}
                        onMouseLeave={() => setIsSortTooltipOpen(false)}
                        onFocus={() => {
                          setSortTooltipColumn("name")
                          setIsSortTooltipOpen(true)
                        }}
                        onBlur={() => setIsSortTooltipOpen(false)}
                        className="mx-auto flex h-full max-w-full cursor-pointer items-center justify-center gap-2 font-medium"
                      >
                        <span className="whitespace-nowrap font-medium">Department</span>
                        <span className="inline-flex shrink-0 flex-col">
                          <span
                            className={`h-0 w-0 border-b-[4px] border-l-3 border-r-3 border-l-transparent border-r-transparent ${
                              sortBy === "name" && sortDirection === "asc"
                                ? "border-b-[#1E8BFF]"
                                : "border-b-white/60"
                            }`}
                          />
                          <span
                            className={`mt-0.5 h-0 w-0 border-l-3 border-r-3 border-t-[4px] border-l-transparent border-r-transparent ${
                              sortBy === "name" && sortDirection === "desc"
                                ? "border-t-[#201547]"
                                : "border-t-white"
                            }`}
                          />
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="rounded-[10px] bg-black px-3.5 py-2.5 text-[13px] font-medium text-white">
                      {getSortTooltip("name")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="border-r border-[#FFFFFF66] p-[8px] align-middle text-left text-[14px] font-medium text-white">
                Address
              </TableHead>
              {canUpdateDepartment && (
                <>
                  <TableHead className="border-r border-[#FFFFFF66] p-[8px] align-middle text-left text-[14px] font-medium text-white">
                    Primary Contact
                  </TableHead>
                  <TableHead className="border-r border-[#FFFFFF66] p-[8px] align-middle text-left text-[14px] font-medium text-white">
                    Secondary Contact
                  </TableHead>
                  <TableHead className="border-r border-[#FFFFFF66] p-[8px] align-middle text-left text-[14px] font-medium text-white">
                    Billing Contact
                  </TableHead>
                </>
              )}
              <TableHead className="border-r border-[#FFFFFF66] p-[4px] align-middle text-center text-[13px] font-medium leading-tight text-white">
                Allow Multi <br /> codes
              </TableHead>
              <TableHead className="border-r border-[#FFFFFF66] p-[4px] align-middle text-center text-[13px] font-medium leading-tight text-white">
                Multi <br /> Codes
              </TableHead>
              <TableHead className="border-r border-[#FFFFFF66] p-[4px] align-middle text-center text-[14px] font-medium text-white">
                Active
              </TableHead>
              {showActionColumn && (
                <TableHead className="p-[4px] align-middle text-center text-[14px] font-medium text-white">
                  Action
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i} className="border-b border-[#E5E7EB]">
                  <TableCell colSpan={tableColumnCount} className="px-[8px] py-[8px]">
                    <Skeleton className="h-[48px] w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : sortedDepartments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tableColumnCount} className="py-[60px] text-center text-[14px] text-[#6B7280]">
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              sortedDepartments.map((dept, index) => (
                <TableRow
                  key={dept.id}
                  className={`border-b border-[#E5E7EB] hover:bg-[#F9FAFB] ${index % 2 !== 0 ? 'bg-[#F9FAFB]' : 'bg-white'}`}
                >
                  <TableCell className="border-r border-[#D1D5DB] px-[8px] py-[6px] align-middle text-center text-[13px] leading-tight font-medium text-[#111827] whitespace-normal break-all">
                    {dept.code}
                  </TableCell>
                  <TableCell className="border-r border-[#D1D5DB] px-[8px] py-[6px] align-middle text-center text-[13px] leading-tight font-medium text-[#111827] whitespace-normal wrap-break-word">
                    {dept.name}
                  </TableCell>
                  <TableCell className="border-r border-[#D1D5DB] px-[8px] py-[6px] align-top text-left">
                    <div className="text-[13px] leading-tight text-[#4B5563] whitespace-normal wrap-break-word">
                      {dept.address.street} <br />
                      {dept.address.city} <br />
                      {dept.address.state} <br />
                      {dept.address.zip}
                    </div>
                  </TableCell>
                  {canUpdateDepartment && (
                    <>
                      <TableCell className="border-r border-[#D1D5DB] px-[8px] py-[4px] align-top">
                        <ContactInfo
                          contactId={dept.primaryContactId}
                          contact={dept.primaryContact}
                          resolved={dept.primaryContactId ? usersById.get(dept.primaryContactId) ?? null : null}
                        />
                      </TableCell>
                      <TableCell className="border-r border-[#D1D5DB] px-[8px] py-[4px] align-top">
                        <ContactInfo
                          contactId={dept.secondaryContactId}
                          contact={dept.secondaryContact}
                          resolved={dept.secondaryContactId ? usersById.get(dept.secondaryContactId) ?? null : null}
                        />
                      </TableCell>
                      <TableCell className="border-r border-[#D1D5DB] px-[8px] py-[4px] align-top">
                        <ContactInfo
                          contactId={dept.billingContactId}
                          contact={dept.billingContact}
                          resolved={dept.billingContactId ? usersById.get(dept.billingContactId) ?? null : null}
                        />
                      </TableCell>
                    </>
                  )}
                  <TableCell className="border-r border-[#D1D5DB] px-[8px] py-[6px] text-center">
                    <div className="flex justify-center">
                      <img 
                        src={dept.settings.allowMultiCodes ? statusCheckImg : statusCrossImg} 
                        alt={dept.settings.allowMultiCodes ? "Check" : "Cross"} 
                        className="h-[14px] w-[14px]" 
                      />
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-[#D1D5DB] px-[8px] py-[6px] text-center">
                    <div className="flex flex-col items-center gap-0 leading-tight">
                      {dept.settings.multiCodes && dept.settings.multiCodes.split(",").filter(Boolean).length > 0 ? (
                        dept.settings.multiCodes.split(",").filter(Boolean).map((code, idx) => (
                          <span key={idx} className="text-[13px] font-medium text-[#111827]">
                            {code}
                          </span>
                        ))
                      ) : (
                        <div className="flex justify-center">
                          <img 
                            src={statusCrossImg} 
                            alt="Cross" 
                            className="h-[14px] w-[14px]" 
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-[#D1D5DB] px-[8px] py-[6px] text-center">
                    <div className="flex justify-center">
                      <img 
                        src={dept.active ? statusCheckImg : statusCrossImg} 
                        alt={dept.active ? "Active" : "Inactive"} 
                        className="h-[14px] w-[14px]" 
                      />
                    </div>
                  </TableCell>
                  {showActionColumn && (
                    <TableCell className="px-[4px] py-[6px] text-center">
                      <div className="inline-flex items-center justify-center gap-0.5">
                        {canViewDepartment ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleHistoryRow({
                                id: dept.id,
                                code: dept.code,
                                name: dept.name,
                              })
                            }
                            className="inline-flex h-[24px] w-[24px] cursor-pointer items-center justify-center rounded-sm text-[#6C5DD3] opacity-80 transition-opacity hover:opacity-100"
                            aria-label={`View history for ${dept.name}`}
                          >
                            <History className="size-[14px]" strokeWidth={2} />
                          </button>
                        ) : null}
                        {(canUpdateDepartment || dept.canEdit) ? (
                          <button
                            type="button"
                            onClick={() => onEdit?.(dept.id)}
                            className="inline-flex h-[24px] w-[24px] cursor-pointer items-center justify-center transition-opacity hover:opacity-80"
                            aria-label={`Edit ${dept.name}`}
                          >
                            <img src={editIconImg} alt="Edit" className="h-[16px] w-[16px]" />
                          </button>
                        ) : null}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!showHistory ? (
        <div className="mt-4">
          <MasterCodePagination
            totalItems={totalItems}
            currentPage={pagination.pageIndex}
            pageSize={pagination.pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      ) : null}

      <Dialog open={historyDialogOpen} onOpenChange={handleHistoryDialogOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-[980px] overflow-hidden rounded-[12px] border border-[#E5E7EB] p-0 shadow-2xl">
          <DialogHeader className="border-b border-[#E5E7EB] bg-[#FAFAFC] px-6 py-4 text-left">
            <DialogTitle className="text-[18px] font-[600] text-[#111827]">
              Department History
            </DialogTitle>
            {historyDepartment ? (
              <p className="text-[13px] text-[#6B7280]">
                {[historyDepartment.code, historyDepartment.name].filter(Boolean).join(" — ")}
              </p>
            ) : null}
          </DialogHeader>
          <div className="max-h-[calc(92vh-88px)] overflow-y-auto px-6 py-4">
            {historyDialogOpen && historyDepartment?.id ? (
              <DepartmentHistoryTable departmentId={historyDepartment.id} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
