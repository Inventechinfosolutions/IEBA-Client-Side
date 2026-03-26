import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, ChevronRight, PlusIcon, SearchIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  countyActivityFilterFormSchema,
  countyActivityAddFormSchema,
  countyActivityFilterDefaultValues,
  countyActivityAddDefaultValues,
} from "../schemas"
import { CountyActivityCodeAddPage } from "./CountyActivityCodeAddPage"
import type {
  CountyActivityCodeRow,
  CountyActivityFilterFormValues,
  CountyActivityAddFormValues,
  CountyActivityCodeTableProps,
  CountyActivityCodeSortableColumn,
  CountyActivityCodeSortDirection,
} from "../types"
import statusCheckImg from "@/assets/status-check.png"
import statusCrossImg from "@/assets/status-cross.png"
import editIconImg from "@/assets/edit-icon.png"
import { useUpdateCountyActivityCode } from "../mutations/updateCountyActivityCode"
import { useCreateCountyActivityCode } from "../mutations/createCountyActivityCode"
import { COUNTY_ACTIVITY_DUMMY_DEPARTMENTS } from "../queries/getCountyActivityCodes"

const PAGE_SIZES = [10, 20, 30, 50] as const

function getFallbackDepartment(row: CountyActivityCodeRow): string {
  const dept = row.department?.trim()
  if (dept) return dept

  const key = `${row.id}|${row.countyActivityCode}|${row.countyActivityName}`
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash + key.charCodeAt(i)) % 2147483647
  }

  return (
    COUNTY_ACTIVITY_DUMMY_DEPARTMENTS[
      hash % COUNTY_ACTIVITY_DUMMY_DEPARTMENTS.length
    ] ?? "Social Services"
  )
}

export function CountyActivityCodeTable({
  rows,
  primaryRows,
  subRowsByParentId,
  pagination,
  totalItems,
  isLoading = false,
  filters,
  onSearchChange,
  onInactiveChange,
  onPageChange,
  onPageSizeChange,
}: CountyActivityCodeTableProps) {
  const filterForm = useForm<CountyActivityFilterFormValues>({
    resolver: zodResolver(countyActivityFilterFormSchema),
    defaultValues: {
      ...countyActivityFilterDefaultValues,
      ...filters,
    },
  })

  const addForm = useForm<CountyActivityAddFormValues>({
    resolver: zodResolver(countyActivityAddFormSchema),
    defaultValues: countyActivityAddDefaultValues,
  })

  const editForm = useForm<CountyActivityAddFormValues>({
    resolver: zodResolver(countyActivityAddFormSchema),
    defaultValues: countyActivityAddDefaultValues,
  })

  const showInactive = filterForm.watch("inactive")
  const searchValue = filterForm.watch("search")
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.pageSize))
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [rowToEdit, setRowToEdit] = useState<CountyActivityCodeRow | null>(null)
  const [addTab, setAddTab] = useState<"primary" | "sub">("primary")
  const [currentPrimaryId, setCurrentPrimaryId] = useState<string | null>(null)
  const [currentPrimaryDefaults, setCurrentPrimaryDefaults] = useState<{
    masterCodeType: string
    masterCode: number
    department: string
  } | null>(null)
  const [sortBy, setSortBy] = useState<CountyActivityCodeSortableColumn | null>(
    null
  )
  const [sortDirection, setSortDirection] =
    useState<CountyActivityCodeSortDirection>(null)
  const [isSortTooltipOpen, setIsSortTooltipOpen] = useState(false)
  const [sortTooltipColumn, setSortTooltipColumn] =
    useState<CountyActivityCodeSortableColumn | null>(null)

  const updateCountyActivityCode = useUpdateCountyActivityCode()
  const createCountyActivityCode = useCreateCountyActivityCode()

  const primaryActivityLabel = (row: CountyActivityCodeRow): string => {
    const full = `${row.countyActivityCode} - ${row.countyActivityName}`
    return full.length > 42 ? row.countyActivityCode : full
  }

  const primaryActivityOptions = useMemo(
    () =>
      primaryRows.map((row) => ({
        label: primaryActivityLabel(row),
        value: row.id,
      })),
    [primaryRows]
  )

  const handleAddSubmit = (tab: "primary" | "sub") =>
    addForm.handleSubmit((values) => {
      createCountyActivityCode.mutate(
        { values, tab, parentId: tab === "sub" ? currentPrimaryId : null },
        {
        onSuccess: (newRow) => {
          toast.success(
            tab === "primary" ? "Primary county detail saved" : "Sub county detail saved"
          )

          if (tab === "primary") {
            // Keep modal open; stay on Primary tab. Remember this primary for Sub creation.
            setCurrentPrimaryId(newRow.id)
            setCurrentPrimaryDefaults({
              masterCodeType: newRow.masterCodeType,
              masterCode: newRow.masterCode,
              department: newRow.department,
            })
            addForm.reset({
              ...countyActivityAddDefaultValues,
              // Clear primary form after save
            })
            return
          }

          // After saving a secondary row, keep the modal open so user can add more secondaries.
          if (currentPrimaryId) {
            setExpandedRowIds((prev) => ({ ...prev, [currentPrimaryId]: true }))
          }
          addForm.reset({
            ...countyActivityAddDefaultValues,
            department: values.department,
            masterCodeType: values.masterCodeType,
            masterCode: values.masterCode,
            active: true,
          })
        },
      }
      )
    })()

  const handleEditSubmit = editForm.handleSubmit((values) => {
    if (!rowToEdit) return
    updateCountyActivityCode.mutate(
      { id: rowToEdit.id, values },
      {
        onSuccess: () => {
          toast.success("County activity updated")
        },
      }
    )
    editForm.reset()
    setEditOpen(false)
    setRowToEdit(null)
  })

  const sortedRows = useMemo(() => {
    if (!sortBy || !sortDirection) return rows
    const direction = sortDirection === "asc" ? 1 : -1
    return [...rows].sort((a, b) =>
      a[sortBy].localeCompare(b[sortBy], undefined, { sensitivity: "base" }) *
      direction
    )
  }, [rows, sortBy, sortDirection])

  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({})

  const getSortTooltip = (column: CountyActivityCodeSortableColumn): string => {
    if (sortBy !== column) return "Click to sort ascending"
    if (sortDirection === "asc") return "Click to sort descending"
    if (sortDirection === "desc") return "Click to cancel sorting"
    return "Click to sort ascending"
  }

  const handleSortToggle = (column: CountyActivityCodeSortableColumn) => {
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
    <div className="space-y-4 rounded-[12px] border border-[#E5E7EB] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] p-3">
        <div className="w-full max-w-[300px]">
          <form
            onSubmit={(event) => event.preventDefault()}
            className="relative"
          >
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              placeholder="Search here"
              className="h-12 rounded-[10px] border border-[#D9D9D9] bg-white pl-9 text-[16px] text-[#1F2937] placeholder:text-[#9CA3AF]"
              {...filterForm.register("search")}
              value={searchValue}
              onChange={(event) => {
                filterForm.setValue("search", event.target.value)
                onSearchChange(event.target.value)
                onPageChange(1)
              }}
            />
          </form>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-12 items-center gap-2 rounded-[10px] bg-[#6C5DD3] px-4 text-white"
            onClick={() => {
              const nextValue = !showInactive
              filterForm.setValue("inactive", nextValue)
              onInactiveChange(nextValue)
              onPageChange(1)
            }}
          >
            <Checkbox
              checked={showInactive}
              className="size-5 rounded-[6px] border-white bg-white data-[state=checked]:border-white data-[state=checked]:bg-[#6C5DD3] data-[state=checked]:text-white"
            />
            <span className="text-[14px] font-normal">Inactive</span>
          </button>
          <Button
            type="button"
            onClick={() => {
              setAddTab("primary")
              setCurrentPrimaryId(null)
              setCurrentPrimaryDefaults(null)
              addForm.reset(countyActivityAddDefaultValues)
              setAddOpen(true)
            }}
            className="h-12 rounded-[10px] bg-[#6C5DD3] px-6 text-[14px] font-normal text-white hover:bg-[#5B4DC5]"
          >
            <PlusIcon className="mr-2 size-4" />
            Add County Activity
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB]">
        <Table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[9%]" />
            <col className="w-[13%]" />
            <col className="w-[12%]" />
            <col className="w-[9%]" />
            <col className="w-[8%]" />
            <col className="w-[6%]" />
            <col className="w-[5%]" />
            <col className="w-[6%]" />
            <col className="w-[4%]" />
            <col className="w-[6%]" />
            <col className="w-[5%]" />
            <col className="w-[8%]" />
            <col className="w-[9%]" />
          </colgroup>
          <TableHeader>
            <TableRow className="h-[91px] bg-[#6C5DD3] hover:bg-[#6C5DD3]">
              {[
                "County Activity Code",
                "County Activity Name",
                "Description",
                "Department",
                "Master Code Type",
                "Master Code",
                "SPMP",
                "Match",
                "%",
                "Active",
                "Leave Code",
                "Multiple Job Pools",
                "Action",
              ].map((column, index) => (
                <TableHead
                  key={column}
                  className={`h-[91px] align-middle border-r border-[#FFFFFF66] bg-[#6C5DD3] p-[12px] text-[14px] font-[400] leading-[1.4] whitespace-normal break-normal text-white font-['Roboto',sans-serif] last:border-r-0 ${
                    ["Match", "%", "Active"].includes(column) ? "text-center" : "text-left"
                  }`}
                >
                  {index < 2 ? (
                    <TooltipProvider>
                      <Tooltip
                        open={
                          isSortTooltipOpen &&
                          sortTooltipColumn ===
                            (index === 0 ? "countyActivityCode" : "countyActivityName")
                        }
                      >
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => {
                              const column =
                                index === 0 ? "countyActivityCode" : "countyActivityName"
                              setSortTooltipColumn(column)
                              setIsSortTooltipOpen(true)
                              handleSortToggle(column)
                            }}
                            onMouseEnter={() => {
                              const column =
                                index === 0 ? "countyActivityCode" : "countyActivityName"
                              setSortTooltipColumn(column)
                              setIsSortTooltipOpen(true)
                            }}
                            onMouseLeave={() => setIsSortTooltipOpen(false)}
                            onFocus={() => {
                              const column =
                                index === 0 ? "countyActivityCode" : "countyActivityName"
                              setSortTooltipColumn(column)
                              setIsSortTooltipOpen(true)
                            }}
                            onBlur={() => setIsSortTooltipOpen(false)}
                            className="flex h-full max-w-full cursor-pointer items-center gap-2 text-left font-[400]"
                          >
                            <span className="max-w-full whitespace-normal break-normal font-[400]">
                              {column}
                            </span>
                            <span className="inline-flex shrink-0 flex-col">
                              <span
                                className={`h-0 w-0 border-b-[5px] border-l-[4px] border-r-[4px] border-l-transparent border-r-transparent ${
                                  sortBy ===
                                    (index === 0
                                      ? "countyActivityCode"
                                      : "countyActivityName") &&
                                  sortDirection === "asc"
                                    ? "border-b-[#1E8BFF]"
                                    : "border-b-white/60"
                                }`}
                              />
                              <span
                                className={`mt-0.5 h-0 w-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent ${
                                  sortBy ===
                                    (index === 0
                                      ? "countyActivityCode"
                                      : "countyActivityName") &&
                                  sortDirection === "desc"
                                    ? "border-t-[#201547]"
                                    : "border-t-white"
                                }`}
                              />
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="rounded-[10px] bg-black px-3.5 py-2.5 text-[13px] font-medium text-white"
                        >
                          {getSortTooltip(
                            index === 0
                              ? "countyActivityCode"
                              : "countyActivityName"
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="inline-flex h-full items-center max-w-full whitespace-normal break-normal font-[400]">
                      {column}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pagination.pageSize }, (_, rowIndex) => (
                <TableRow
                  key={`skeleton-${rowIndex}`}
                  className="border-b border-[#E5E7EB]"
                >
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    <Skeleton className="h-4 w-[90%]" />
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] leading-[1.4] whitespace-normal break-words font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    <Skeleton className="h-4 w-[95%]" />
                  </TableCell>
                  <TableCell className="max-w-0 border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] leading-[1.4] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    <Skeleton className="h-4 w-[100%]" />
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    <Skeleton className="h-4 w-[70%]" />
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    <Skeleton className="h-4 w-[80%]" />
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    <Skeleton className="h-4 w-[60%]" />
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center text-[13px] text-[#C4C4C4]">
                    <Skeleton className="mx-auto h-4 w-4" />
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-center text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    <Skeleton className="mx-auto h-4 w-[40%]" />
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[8px] py-[5px] align-top text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    <Skeleton className="mx-auto h-4 w-[70%]" />
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center">
                    <Skeleton className="mx-auto h-4 w-4" />
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center text-[#C4C4C4]">
                    <Skeleton className="mx-auto h-4 w-4" />
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center text-[#C4C4C4]">
                    <Skeleton className="mx-auto h-4 w-4" />
                  </TableCell>
                  <TableCell className="px-[14px] py-[5px] align-top text-center">
                    <Skeleton className="mx-auto h-6 w-6" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={13}
                  className="h-20 text-center text-sm text-muted-foreground"
                >
                  No county activity codes found.
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.flatMap((row) => {
                const children = subRowsByParentId[row.id] ?? []
                const isExpanded = Boolean(expandedRowIds[row.id])
                const hasChildren = children.length > 0

                const primaryRow = (
                  <TableRow key={row.id} className="border-b border-[#E5E7EB]">
                    <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                      <button
                        type="button"
                        className={`mr-2 inline-flex size-5 items-center justify-center rounded-[6px] ${
                          hasChildren ? "text-[#6C5DD3] hover:bg-[#6C5DD3]/10" : "opacity-0"
                        }`}
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                        onClick={() => {
                          if (!hasChildren) return
                          setExpandedRowIds((prev) => ({
                            ...prev,
                            [row.id]: !prev[row.id],
                          }))
                        }}
                      >
                        {hasChildren ? (
                          isExpanded ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )
                        ) : null}
                      </button>
                      <span className="align-middle">{row.countyActivityCode}</span>
                    </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] leading-[1.4] whitespace-normal break-words font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    {row.countyActivityName}
                  </TableCell>
                  <TableCell className="max-w-0 border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] leading-[1.4] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block w-full cursor-default truncate">
                            {row.description}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="center"
                          sideOffset={4}
                          className="max-w-[260px] whitespace-normal rounded-[8px] bg-black px-3 py-2 text-left text-[12px] font-medium leading-[1.4] text-white"
                        >
                          {row.description}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] leading-[1.4] whitespace-normal break-words font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    {getFallbackDepartment(row)}
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    {row.masterCodeType}
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    {row.masterCode}
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center text-[13px] text-[#C4C4C4]">
                    {row.spmp ? (
                      <img
                        src={statusCheckImg}
                        alt="Yes"
                        className="mx-auto h-4 w-4 object-contain"
                      />
                    ) : (
                      <img
                        src={statusCrossImg}
                        alt="No"
                        className="mx-auto h-4 w-4 object-contain"
                      />
                    )}
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-center text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    {row.match}
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[8px] py-[5px] align-top text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    <span className="block w-full text-center">
                      {row.percentage.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center">
                    {row.active && (
                      <img
                        src={statusCheckImg}
                        alt="active"
                        className="mx-auto h-4 w-4 object-contain"
                      />
                    )}
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center text-[#C4C4C4]">
                    {row.leaveCode ? (
                      <img
                        src={statusCheckImg}
                        alt="leave code"
                        className="mx-auto h-4 w-4 object-contain"
                      />
                    ) : (
                      <img
                        src={statusCrossImg}
                        alt="No"
                        className="mx-auto h-4 w-4 object-contain"
                      />
                    )}
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center text-[#C4C4C4]">
                    {row.multipleJobPools ? (
                      <img
                        src={statusCheckImg}
                        alt="multiple job pools"
                        className="mx-auto h-4 w-4 object-contain"
                      />
                    ) : (
                      <img
                        src={statusCrossImg}
                        alt="No"
                        className="mx-auto h-4 w-4 object-contain"
                      />
                    )}
                  </TableCell>
                  <TableCell className="px-[14px] py-[5px] align-top text-center">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                      onClick={() => {
                        setRowToEdit(row)
                        editForm.reset({
                          countyActivityCode: row.countyActivityCode,
                          countyActivityName: row.countyActivityName,
                          description: row.description,
                          department: row.department,
                          masterCodeType: row.masterCodeType,
                          masterCode: row.masterCode,
                          match: row.match,
                          percentage: row.percentage,
                          active: row.active,
                          leaveCode: row.leaveCode,
                          multipleJobPools: row.multipleJobPools,
                        })
                        setEditOpen(true)
                      }}
                    >
                      <img
                        src={editIconImg}
                        alt="Edit"
                        className="h-4 w-4 object-contain"
                      />
                    </Button>
                  </TableCell>
                  </TableRow>
                )

                const secondaryRows = isExpanded
                  ? children.map((child) => (
                      <TableRow
                        key={child.id}
                        className="border-b border-[#E5E7EB] bg-[#F6F5FF]"
                      >
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          <span className="ml-7">{child.countyActivityCode}</span>
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] leading-[1.4] whitespace-normal break-words font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          {child.countyActivityName}
                        </TableCell>
                        <TableCell className="max-w-0 border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] leading-[1.4] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          {child.description}
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] leading-[1.4] whitespace-normal break-words font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          {child.rowType === "sub" ? "" : getFallbackDepartment(child)}
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          {child.rowType === "sub" ? "" : child.masterCodeType}
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          {child.rowType === "sub" ? "" : child.masterCode}
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center text-[13px] text-[#C4C4C4]">
                          {child.spmp ? (
                            <img
                              src={statusCheckImg}
                              alt="Yes"
                              className="mx-auto h-4 w-4 object-contain"
                            />
                          ) : (
                            <img
                              src={statusCrossImg}
                              alt="No"
                              className="mx-auto h-4 w-4 object-contain"
                            />
                          )}
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-center text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          {child.match}
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[8px] py-[5px] align-top text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          <span className="block w-full text-center">
                            {child.percentage.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center">
                          {child.active && (
                            <img
                              src={statusCheckImg}
                              alt="active"
                              className="mx-auto h-4 w-4 object-contain"
                            />
                          )}
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center text-[#C4C4C4]">
                          {child.leaveCode ? (
                            <img
                              src={statusCheckImg}
                              alt="leave code"
                              className="mx-auto h-4 w-4 object-contain"
                            />
                          ) : (
                            <img
                              src={statusCrossImg}
                              alt="No"
                              className="mx-auto h-4 w-4 object-contain"
                            />
                          )}
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center text-[#C4C4C4]">
                          {child.multipleJobPools ? (
                            <img
                              src={statusCheckImg}
                              alt="multiple job pools"
                              className="mx-auto h-4 w-4 object-contain"
                            />
                          ) : (
                            <img
                              src={statusCrossImg}
                              alt="No"
                              className="mx-auto h-4 w-4 object-contain"
                            />
                          )}
                        </TableCell>
                        <TableCell className="px-[14px] py-[5px] align-top text-center">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                            onClick={() => {
                              const parent =
                                child.parentId
                                  ? primaryRows.find((row) => row.id === child.parentId) ?? null
                                  : null
                              setRowToEdit(child)
                              editForm.reset({
                                countyActivityCode: child.countyActivityCode,
                                countyActivityName: child.countyActivityName,
                                description: child.description,
                                department: child.department,
                                masterCodeType: child.masterCodeType,
                                masterCode: parent?.masterCode ?? 0,
                                match: child.match,
                                percentage: child.percentage,
                                active: child.active,
                                leaveCode: child.leaveCode,
                                multipleJobPools: child.multipleJobPools,
                              })
                              setEditOpen(true)
                            }}
                          >
                            <img
                              src={editIconImg}
                              alt="Edit"
                              className="h-4 w-4 object-contain"
                            />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  : []

                return [primaryRow, ...secondaryRows]
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="my-8 flex min-h-[67px] w-full flex-wrap items-center justify-end gap-3 rounded-[15px] bg-[#FFFFFF] px-4 py-3 shadow-[0_0_20px_0_#0000001a]">
        <span className="text-[14px] text-[#4B5563]">Total {totalItems} items</span>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent className="gap-1">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text=""
                onClick={(event) => {
                  event.preventDefault()
                  if (pagination.page > 1) onPageChange(pagination.page - 1)
                }}
                className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {pageNumbers.slice(0, 7).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={pagination.page === page}
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
                  if (pagination.page < totalPages) onPageChange(pagination.page + 1)
                }}
                className={pagination.page >= totalPages ? "pointer-events-none opacity-50" : ""}
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
              <span className="text-[14px] text-[#4B5563]">{pagination.pageSize} / page</span>
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          showClose={false}
          className="max-h-[85vh] w-[1120px] max-w-[calc(100vw-2rem)] overflow-y-auto border-0 bg-transparent p-0 shadow-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          overlayClassName="bg-black/50"
        >
          <CountyActivityCodeAddPage
            form={addForm}
            onSubmit={handleAddSubmit}
            tab={addTab}
            onTabChange={(nextTab) => {
              setAddTab(nextTab)
              if (nextTab === "sub" && currentPrimaryDefaults) {
                addForm.setValue("masterCodeType", currentPrimaryDefaults.masterCodeType, {
                  shouldValidate: true,
                })
                addForm.setValue("masterCode", currentPrimaryDefaults.masterCode, {
                  shouldValidate: true,
                })
                addForm.setValue("department", currentPrimaryDefaults.department, {
                  shouldValidate: true,
                })
                if (!currentPrimaryId) {
                  const match = primaryRows.find(
                    (r) =>
                      r.masterCode === currentPrimaryDefaults.masterCode &&
                      r.masterCodeType === currentPrimaryDefaults.masterCodeType
                  )
                  if (match) setCurrentPrimaryId(match.id)
                }
              }
            }}
            primaryActivityCodeOptions={primaryActivityOptions}
            selectedPrimaryId={currentPrimaryId}
            onSelectedPrimaryIdChange={(id) => {
              setCurrentPrimaryId(id)
              const selected = primaryRows.find((r) => r.id === id)
              if (!selected) return
              // Keep form values consistent for save/linking
              addForm.setValue("masterCodeType", selected.masterCodeType, { shouldValidate: true })
              addForm.setValue("masterCode", selected.masterCode, { shouldValidate: true })
              addForm.setValue("department", selected.department, { shouldValidate: true })
            }}
            onClose={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          showClose={false}
          className="max-h-[85vh] w-[1120px] max-w-[calc(100vw-2rem)] overflow-y-auto border-0 bg-transparent p-0 shadow-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          overlayClassName="bg-black/50"
        >
          {rowToEdit ? (
            <CountyActivityCodeAddPage
              key={rowToEdit.id}
              mode="edit"
              form={editForm}
              tab={rowToEdit.rowType === "sub" ? "sub" : "primary"}
              onTabChange={() => {}}
              disabledTabs={{
                primary: rowToEdit.rowType === "sub",
                sub: rowToEdit.rowType !== "sub",
              }}
              primaryActivityCodeOptions={primaryActivityOptions}
              selectedPrimaryId={rowToEdit.rowType === "sub" ? (rowToEdit.parentId ?? null) : null}
              onSelectedPrimaryIdChange={(id) => {
                // For edit-sub: allow re-parenting if needed
                setRowToEdit((prev) => (prev ? { ...prev, parentId: id } : prev))
                const selected = primaryRows.find((r) => r.id === id)
                if (!selected) return
                editForm.setValue("masterCodeType", selected.masterCodeType)
                editForm.setValue("masterCode", selected.masterCode)
                editForm.setValue("department", selected.department)
              }}
              onSubmit={() => handleEditSubmit()}
              onClose={() => {
                setEditOpen(false)
                setRowToEdit(null)
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
