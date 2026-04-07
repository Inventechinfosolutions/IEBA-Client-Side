import { useState, useMemo } from "react"
import { User, Phone, Mail, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  PAGE_SIZES,
  type DepartmentContactCellProps,
  type DepartmentTableProps,
  type SortColumn,
  type SortDirection,
} from "../types"
import { useGetDepartmentUsers } from "../queries/getDepartmentUsers"
import statusCheckImg from "@/assets/status-check.png"
import statusCrossImg from "@/assets/status-cross.png"
import editIconImg from "@/assets/edit-icon.png"



const ContactInfo = ({
  contactId,
  contact,
  resolved,
}: DepartmentContactCellProps) => {
  const hasId = !!contactId?.trim()
  const effective = resolved ?? contact
  const hasDisplay =
    !!effective &&
    effective.name.trim() !== "" &&
    effective.name !== "Not Assigned"

  if (!hasDisplay && !hasId) {
    return (
      <div className="flex flex-col w-full text-[13px] text-[#111827]">
        <div className="flex items-center gap-[6px] py-[6px]">
          <User className="h-[14px] w-[14px] text-[#6C5DD3]" />
          <span>Not Assigned</span>
        </div>
        <div className="flex items-center gap-[6px] border-t border-[#E5E7EB] py-[6px]">
          <Phone className="h-[14px] w-[14px] text-[#6C5DD3]" />
        </div>
        <div className="flex items-center gap-[6px] border-t border-[#E5E7EB] py-[6px]">
          <Mail className="h-[14px] w-[14px] text-[#6C5DD3]" />
        </div>
        <div className="flex items-center gap-[6px] border-t border-[#E5E7EB] py-[6px]">
          <MapPin className="h-[14px] w-[14px] text-[#6C5DD3]" />
        </div>
      </div>
    )
  }

  if (hasId && !hasDisplay) {
    return (
      <div className="flex flex-col w-full text-[13px] text-[#111827]">
        <div className="flex items-center gap-[6px] py-[6px]">
          <User className="h-[14px] w-[14px] text-[#6C5DD3]" />
          <span className="text-[#6B7280]">Contact assigned</span>
        </div>
        <div className="flex items-center gap-[6px] border-t border-[#E5E7EB] py-[6px]">
          <Phone className="h-[14px] w-[14px] text-[#6C5DD3]" />
        </div>
        <div className="flex items-center gap-[6px] border-t border-[#E5E7EB] py-[6px]">
          <Mail className="h-[14px] w-[14px] text-[#6C5DD3]" />
        </div>
        <div className="flex items-center gap-[6px] border-t border-[#E5E7EB] py-[6px]">
          <MapPin className="h-[14px] w-[14px] text-[#6C5DD3]" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full text-[13px] text-[#111827]">
      <div className="flex items-center gap-[6px] py-[6px]">
        <User className="h-[14px] w-[14px] text-[#6C5DD3]" />
        <span>{effective!.name}</span>
      </div>
      <div className="flex items-center gap-[6px] border-t border-[#E5E7EB] py-[6px]">
        <Phone className="h-[14px] w-[14px] text-[#6C5DD3]" />
        <span className="text-[#6C5DD3]">{effective!.phone || ""}</span>
      </div>
      <div className="flex flex-wrap items-center gap-[6px] border-t border-[#E5E7EB] py-[6px]">
        <Mail className="h-[14px] w-[14px] text-[#6C5DD3] shrink-0" />
        {effective!.email ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[#6C5DD3] break-words break-all text-[12px] cursor-pointer">
                  {effective!.email}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="rounded-[8px] bg-[#222222] px-3 py-2 text-[14px] font-[500] text-white shadow-lg border-0"
                sideOffset={4}
              >
                {effective!.email}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-[#6C5DD3] break-words break-all text-[12px]">{""}</span>
        )}
      </div>
      <div className="flex items-center gap-[6px] border-t border-[#E5E7EB] py-[6px]">
        <MapPin className="h-[14px] w-[14px] text-[#6C5DD3]" />
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

  const usersQuery = useGetDepartmentUsers()
  const usersById = useMemo(() => {
    const map = new Map<string, { name: string; email: string; phone: string; location: string }>()
    for (const u of usersQuery.data ?? []) {
      map.set(u.id, { name: u.name, email: u.email, phone: u.phone, location: u.location })
    }
    return map
  }, [usersQuery.data])

  const [sortBy, setSortBy] = useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [isSortTooltipOpen, setIsSortTooltipOpen] = useState(false)
  const [sortTooltipColumn, setSortTooltipColumn] = useState<SortColumn>(null)

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

  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.pageSize))
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <div className="flex flex-1 flex-col gap-[24px]">
  
      <div className="flex items-center justify-between">
        <div className="w-[300px]">
          <Input
            value={filters.search || ""}
            onChange={(e) => {
              onSearchChange(e.target.value)
              onPageChange(1)
              setSortBy(null)
              setSortDirection(null)
            }}
            placeholder="Search here"
            className="h-[48px] w-full rounded-[8px] border-[#E5E7EB] bg-white px-[15px] py-[12px] text-[14px] shadow-sm focus-visible:ring-1 focus-visible:ring-[#6C5DD3]"
          />
        </div>

        <div className="flex items-center gap-[12px]">
          <button
            type="button"
            className="flex h-[48px] items-center gap-2 rounded-[10px] bg-[#6C5DD3] px-4 text-white mr-[12px]"
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
            <span className="text-[14px] font-[500] text-white select-none whitespace-nowrap">Inactive</span>
          </button>

          <Button
            onClick={onAdd}
            className="h-[48px] rounded-[8px] bg-[#6C5DD3] px-[20px] text-[14px] font-[500] hover:bg-[#5B4DC5]"
          >
            <span className="mr-2 text-[18px]">+</span> Add Department
          </Button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white">
        <Table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[8%]" />
            <col className="w-[10%]" />
            <col className="w-[8%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[6%]" />
            <col className="w-[6%]" />
            <col className="w-[6%]" />
            <col className="w-[6%]" />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-[#6C5DD3] hover:bg-[#6C5DD3]">
              <TableHead className="h-[91px] border-r border-[#FFFFFF66] p-[12px] align-middle text-left text-[14px] font-[400] font-['Roboto',sans-serif] leading-[1.4] text-white whitespace-normal break-normal">
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
                        className="flex h-full max-w-full cursor-pointer items-center gap-2 text-left font-[400]"
                      >
                        <span className="max-w-full whitespace-normal break-normal font-[400]">Code</span>
                        <span className="inline-flex shrink-0 flex-col">
                          <span
                            className={`h-0 w-0 border-b-[5px] border-l-[4px] border-r-[4px] border-l-transparent border-r-transparent ${
                              sortBy === "code" && sortDirection === "asc"
                                ? "border-b-[#1E8BFF]"
                                : "border-b-white/60"
                            }`}
                          />
                          <span
                            className={`mt-0.5 h-0 w-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent ${
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
              <TableHead className="h-[91px] border-r border-[#FFFFFF66] p-[12px] align-middle text-left text-[14px] font-[400] font-['Roboto',sans-serif] leading-[1.4] text-white whitespace-normal break-normal">
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
                        className="flex h-full max-w-full cursor-pointer items-center gap-2 text-left font-[400]"
                      >
                        <span className="max-w-full whitespace-normal break-normal font-[400]">Department</span>
                        <span className="inline-flex shrink-0 flex-col">
                          <span
                            className={`h-0 w-0 border-b-[5px] border-l-[4px] border-r-[4px] border-l-transparent border-r-transparent ${
                              sortBy === "name" && sortDirection === "asc"
                                ? "border-b-[#1E8BFF]"
                                : "border-b-white/60"
                            }`}
                          />
                          <span
                            className={`mt-0.5 h-0 w-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent ${
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
              <TableHead className="border-r border-[#FFFFFF66] px-[8px] py-[28px] text-left text-[14px] font-[500] text-white whitespace-normal break-words leading-tight">
                Address
              </TableHead>
              <TableHead className="border-r border-[#FFFFFF66] px-[8px] py-[28px] text-left text-[14px] font-[500] text-white whitespace-normal break-words leading-tight">
                Primary Contact
              </TableHead>
              <TableHead className="border-r border-[#FFFFFF66] px-[8px] py-[28px] text-left text-[14px] font-[500] text-white whitespace-normal break-words leading-tight">
                Secondary Contact
              </TableHead>
              <TableHead className="border-r border-[#FFFFFF66] px-[8px] py-[28px] text-left text-[14px] font-[500] text-white whitespace-normal break-words leading-tight">
                Billing Contact
              </TableHead>
              <TableHead className="border-r border-[#FFFFFF66] px-[4px] py-[28px] text-center text-[14px] font-[500] text-white whitespace-normal break-words leading-[1.1]">
                Allow Multi <br /> Codes
              </TableHead>
              <TableHead className="border-r border-[#FFFFFF66] px-[4px] py-[28px] text-center text-[14px] font-[500] text-white whitespace-normal break-words leading-[1.1]">
                Multi <br /> Codes
              </TableHead>
              <TableHead className="border-r border-[#FFFFFF66] px-[4px] py-[28px] text-center text-[14px] font-[500] text-white whitespace-normal break-words leading-tight">
                Active
              </TableHead>
              <TableHead className="px-[4px] py-[28px] text-center text-[14px] font-[500] text-white whitespace-normal break-words leading-tight">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i} className="border-b border-[#E5E7EB]">
                  <TableCell colSpan={10} className="px-[16px] py-[16px]">
                    <Skeleton className="h-[80px] w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : sortedDepartments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-[60px] text-center text-[14px] text-[#6B7280]">
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              sortedDepartments.map((dept, index) => (
                <TableRow
                  key={dept.id}
                  className={`border-b border-[#E5E7EB] hover:bg-[#F9FAFB] ${index % 2 !== 0 ? 'bg-[#F9FAFB]' : 'bg-white'}`}
                >
                  <TableCell className="border-r border-[#E5E7EB] px-[8px] py-[16px] align-top text-[13px] font-[500] text-[#111827] truncate">
                    {dept.code}
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[8px] py-[16px] align-top text-[13px] font-[500] text-[#111827] whitespace-normal break-words">
                    {dept.name}
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[8px] py-[16px] align-top text-left">
                    <div className="text-[13px] text-[#4B5563] whitespace-normal break-words leading-relaxed">
                      {dept.address.street} <br />
                      {dept.address.city} <br />
                      {dept.address.state} <br />
                      {dept.address.zip}
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[8px] py-[10px] align-top">
                    <ContactInfo
                      contactId={dept.primaryContactId}
                      contact={dept.primaryContact}
                      resolved={dept.primaryContactId ? usersById.get(dept.primaryContactId) ?? null : null}
                    />
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[8px] py-[10px] align-top">
                    <ContactInfo
                      contactId={dept.secondaryContactId}
                      contact={dept.secondaryContact}
                      resolved={dept.secondaryContactId ? usersById.get(dept.secondaryContactId) ?? null : null}
                    />
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[8px] py-[10px] align-top border-r-0 sm:border-r">
                    <ContactInfo
                      contactId={dept.billingContactId}
                      contact={dept.billingContact}
                      resolved={dept.billingContactId ? usersById.get(dept.billingContactId) ?? null : null}
                    />
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[8px] py-[16px] text-center">
                    <div className="flex justify-center">
                      <img 
                        src={dept.settings.allowMultiCodes ? statusCheckImg : statusCrossImg} 
                        alt={dept.settings.allowMultiCodes ? "Check" : "Cross"} 
                        className="h-[14px] w-[14px]" 
                      />
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[8px] py-[16px] text-center">
                    <div className="flex flex-col items-center gap-1">
                      {dept.settings.multiCodes ? (
                        dept.settings.multiCodes.split(",").filter(Boolean).map((code, idx) => (
                          <span key={idx} className="text-[13px] font-[500] text-[#111827]">
                            {code}
                          </span>
                        ))
                      ) : (
                        <span className="text-[13px] font-[500] text-[#111827]">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[8px] py-[16px] text-center">
                    <div className="flex justify-center">
                      <img 
                        src={dept.active ? statusCheckImg : statusCrossImg} 
                        alt={dept.active ? "Active" : "Inactive"} 
                        className="h-[14px] w-[14px]" 
                      />
                    </div>
                  </TableCell>
                  <TableCell className="px-[4px] py-[16px] text-center">
                    <button
                      onClick={() => onEdit?.(dept.id)}
                      className="inline-flex h-[28px] w-[28px] items-center justify-center transition-opacity hover:opacity-80"
                    >
                      <img src={editIconImg} alt="Edit" className="h-[18px] w-[18px]" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ────────────────────────────────────────────────── */}
      <div className="my-8 flex min-h-[67px] w-full flex-wrap items-center justify-end gap-3 rounded-[12px] bg-[#FFFFFF] px-4 py-3 shadow-[0_0_20px_0_#0000001a]">
        <span className="text-[14px] text-[#4B5563]">Total {totalItems} items</span>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent className="gap-1">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text=""
                onClick={(event) => {
                  event.preventDefault()
                  if (pagination.pageIndex > 1) onPageChange(pagination.pageIndex - 1)
                }}
                className={pagination.pageIndex <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {pageNumbers.slice(0, 7).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={pagination.pageIndex === page}
                  onClick={(event) => {
                    event.preventDefault()
                    onPageChange(page)
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                text=""
                onClick={(event) => {
                  event.preventDefault()
                  if (pagination.pageIndex < totalPages) onPageChange(pagination.pageIndex + 1)
                }}
                className={pagination.pageIndex >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <Select
          value={String(pagination.pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-10 w-[108px] rounded-[12px] border-[#E5E7EB]">
            <SelectValue>
              <span className="text-[14px] text-[#4B5563]">
                {pagination.pageSize} / page
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
