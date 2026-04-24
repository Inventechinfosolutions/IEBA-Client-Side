import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { PlusIcon, SearchIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { TitleCaseInput } from "@/components/ui/title-case-input"
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
import { useGetDepartments } from "@/features/department/queries/getDepartments"
import editIconImg from "@/assets/edit-icon.png"
import statusCheckImg from "@/assets/status-check.png"
import { useAuth } from "@/contexts/AuthContext"
import { usePermissions } from "@/hooks/usePermissions"
import { getUserDetails } from "@/features/auth/api/getUserDetails"

import {
  detailToUpsertFormValues,
  mergeDetailActivitiesToPickRows,
} from "../api/costPoolApi"
import { CostPoolAddPage } from "./CostPoolAddPage"
import { useCreateCostPool } from "../mutations/createCostPool"
import { useUpdateCostPool } from "../mutations/updateCostPool"
import { useCostPoolActivityPicklistQuery } from "../queries/getCostPoolActivityPicklist"
import { useCostPoolDetailQuery } from "../queries/getCostPoolDetail"
import {
  costPoolFilterDefaultValues,
  costPoolFilterFormSchema,
  costPoolUpsertDefaultValues,
  costPoolUpsertFormSchema,
} from "../schemas"
import { CostPoolUpsertMode } from "../enums/cost-pool.enum"
import {
  COST_POOL_SORT_DIRECTION,
  COST_POOL_SORT_STATE,
} from "../types"
import type {
  CostPoolActivityPickRow,
  CostPoolDepartmentOption,
  CostPoolDetailResDto,
  CostPoolRow,
  CostPoolFilterFormValues,
  CostPoolSortableColumn,
  CostPoolSortDirection,
  CostPoolSortState,
  CostPoolTableProps,
  CostPoolUpsertFormValues,
} from "../types"

const PAGE_SIZES = [10, 20, 30, 50] as const

function CostPoolCreateDialogContent({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const { user } = useAuth()
  const { isSuperAdmin } = usePermissions()
  const isRestricted = !isSuperAdmin
  
  const departmentsQuery = useGetDepartments({ status: "active", page: 1, limit: 100 })
  
  // Locally fetch user details to get the most accurate department list
  const { data: userDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["user-details-local", user?.id],
    queryFn: () => (user?.id ? getUserDetails(user.id) : Promise.reject("No user ID")),
    enabled: !!user?.id && isRestricted,
  })

  const departmentOptions = useMemo(() => {
    const rawOptions = (departmentsQuery.data?.items ?? []).map((d) => ({
      id: Number(d.id),
      name: d.name,
    }))
    
    if (isSuperAdmin) return rawOptions.map(opt => ({ ...opt, id: String(opt.id) }))
    
    // Get assigned IDs from local API response or context
    const apiDepts = (userDetails as any)?.data?.departments || (userDetails as any)?.departments
    const contextDepts = user?.departmentRoles || []
    
    const assignedIds = new Set<number>()
    
    if (Array.isArray(apiDepts)) {
      apiDepts.forEach((d: any) => assignedIds.add(Number(d.id || d.departmentId)))
    }
    if (assignedIds.size === 0 && Array.isArray(contextDepts)) {
      contextDepts.forEach((dr) => assignedIds.add(Number(dr.departmentId)))
    }
      
    // If we have assigned IDs, filter the list. Otherwise return all (fallback)
    const filtered = assignedIds.size > 0 
      ? rawOptions.filter(opt => assignedIds.has(opt.id))
      : rawOptions

    // Convert to the expected type CostPoolDepartmentOption[] (id must be string)
    return filtered.map(opt => ({
      ...opt,
      id: String(opt.id)
    }))
  }, [departmentsQuery.data, userDetails, user, isSuperAdmin])

  const form = useForm<CostPoolUpsertFormValues>({
    resolver: zodResolver(costPoolUpsertFormSchema),
    defaultValues: costPoolUpsertDefaultValues,
    mode: "onChange",
  })

  const departmentId = form.watch("departmentId")
  const picklist = useCostPoolActivityPicklistQuery(departmentId, {
    enabled: departmentId > 0,
  })

  const activityRows = picklist.data ?? []
  const createMutation = useCreateCostPool()

  const submit = form.handleSubmit((values) => {
    createMutation.mutate(
      { values },
      {
        onSuccess: () => {
          form.reset(costPoolUpsertDefaultValues)
          onCreated()
          onClose()
        },
      },
    )
  })

  return (
    <CostPoolAddPage
      mode={CostPoolUpsertMode.ADD}
      form={form}
      onSubmit={() => void submit()}
      onClose={onClose}
      departmentOptions={departmentOptions}
      departmentsLoading={departmentsQuery.isPending || isDetailsLoading}
      activityRows={activityRows}
      activitiesLoading={picklist.isPending && departmentId > 0}
    />
  )
}

/**
 * Mount only after GET /costpool/:id succeeds so `useForm` gets correct `defaultValues`.
 * Using `useForm({ values })` above while toggling loading → form led to empty fields until remount.
 */
function CostPoolEditFormBody({
  costPoolId,
  detail,
  activityRows,
  activitiesLoading,
  departmentOptions,
  departmentsLoading,
  onClose,
  onUpdated,
}: {
  costPoolId: number
  detail: CostPoolDetailResDto
  activityRows: CostPoolActivityPickRow[]
  activitiesLoading: boolean
  departmentOptions: CostPoolDepartmentOption[]
  departmentsLoading: boolean
  onClose: () => void
  onUpdated: () => void
}) {
  const form = useForm<CostPoolUpsertFormValues>({
    resolver: zodResolver(costPoolUpsertFormSchema),
    defaultValues: detailToUpsertFormValues(detail),
  })

  const updateMutation = useUpdateCostPool()

  const submit = form.handleSubmit((values) => {
    updateMutation.mutate(
      { id: costPoolId, values },
      {
        onSuccess: () => {
          onUpdated()
          onClose()
        },
      },
    )
  })

  return (
    <CostPoolAddPage
      mode={CostPoolUpsertMode.EDIT}
      form={form}
      onSubmit={() => void submit()}
      onClose={onClose}
      departmentOptions={departmentOptions}
      departmentsLoading={departmentsLoading}
      activityRows={activityRows}
      activitiesLoading={activitiesLoading}
    />
  )
}

function CostPoolEditDialogContent({
  costPoolId,
  onClose,
  onUpdated,
}: {
  costPoolId: number
  onClose: () => void
  onUpdated: () => void
}) {
  const detailQuery = useCostPoolDetailQuery(costPoolId, {
    enabled: true,
    refetchOnMountAlways: true,
  })
  const { user } = useAuth()
  const { isSuperAdmin } = usePermissions()
  const isRestricted = !isSuperAdmin

  const departmentsQuery = useGetDepartments({ status: "active", page: 1, limit: 100 })
  
  const { data: userDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["user-details-local", user?.id],
    queryFn: () => (user?.id ? getUserDetails(user.id) : Promise.reject("No user ID")),
    enabled: !!user?.id && isRestricted,
  })

  const departmentOptions = useMemo(() => {
    const rawOptions = (departmentsQuery.data?.items ?? []).map((d) => ({
      id: Number(d.id),
      name: d.name,
    }))
    
    if (isSuperAdmin) return rawOptions.map(opt => ({ ...opt, id: String(opt.id) }))
    
    const apiDepts = (userDetails as any)?.data?.departments || (userDetails as any)?.departments
    const contextDepts = user?.departmentRoles || []
    
    const assignedIds = new Set<number>()
    
    if (Array.isArray(apiDepts)) {
      apiDepts.forEach((d: any) => assignedIds.add(Number(d.id || d.departmentId)))
    }
    if (assignedIds.size === 0 && Array.isArray(contextDepts)) {
      contextDepts.forEach((dr) => assignedIds.add(Number(dr.departmentId)))
    }
      
    return assignedIds.size > 0 
      ? rawOptions.filter(opt => assignedIds.has(opt.id)).map(opt => ({ ...opt, id: String(opt.id) }))
      : rawOptions.map(opt => ({ ...opt, id: String(opt.id) }))
  }, [departmentsQuery.data, userDetails, user, isSuperAdmin])

  const activityRows = useMemo(() => {
    if (!detailQuery.data) return []
    return mergeDetailActivitiesToPickRows(detailQuery.data)
  }, [detailQuery.data])

  if (detailQuery.isError) {
    return (
      <div className="flex min-h-[240px] w-full max-w-[1150px] items-center justify-center rounded-[10px] bg-white p-8 shadow-[0_0_20px_0_#0000001a]">
        <span className="text-sm text-destructive">Could not load this cost pool.</span>
      </div>
    )
  }

  if (!detailQuery.data) {
    return (
      <div className="flex min-h-[240px] w-full max-w-[1150px] items-center justify-center rounded-[10px] bg-white p-8 shadow-[0_0_20px_0_#0000001a]">
        <span className="text-sm text-muted-foreground">Loading cost pool…</span>
      </div>
    )
  }

  return (
    <CostPoolEditFormBody
      key={costPoolId}
      costPoolId={costPoolId}
      detail={detailQuery.data}
      activityRows={activityRows}
      activitiesLoading={detailQuery.isFetching}
      departmentOptions={departmentOptions}
      departmentsLoading={departmentsQuery.isPending || isDetailsLoading}
      onClose={onClose}
      onUpdated={onUpdated}
    />
  )
}

export function CostPoolTable({
  rows,
  pagination,
  totalItems,
  isLoading = false,
  filters,
  onSearchChange,
  onInactiveChange,
  onPageChange,
  onPageSizeChange,
}: CostPoolTableProps) {
  const navigate = useNavigate()
  const { canAdd, canUpdate } = usePermissions()
  const canAddCostPool = canAdd("costpool")
  const canUpdateCostPool = canUpdate("costpool")
  const filterForm = useForm<CostPoolFilterFormValues>({
    resolver: zodResolver(costPoolFilterFormSchema),
    defaultValues: {
      ...costPoolFilterDefaultValues,
      ...filters,
    },
  })

  const showInactive = filterForm.watch("inactive")
  const searchValue = filterForm.watch("search")
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.pageSize))
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [rowToEdit, setRowToEdit] = useState<CostPoolRow | null>(null)
  const [sortBy, setSortBy] = useState<CostPoolSortableColumn | null>(null)
  const [sortDirection, setSortDirection] =
    useState<CostPoolSortDirection>(null)
  const [openTooltipColumn, setOpenTooltipColumn] =
    useState<CostPoolSortableColumn | null>(null)

  const sortedRows = useMemo(() => {
    if (!sortBy || !sortDirection) return rows
    const direction = sortDirection === COST_POOL_SORT_DIRECTION.ASC ? 1 : -1
    return [...rows].sort(
      (a, b) =>
        a[sortBy].localeCompare(b[sortBy], undefined, {
          sensitivity: "base",
          numeric: true,
        }) * direction,
    )
  }, [rows, sortBy, sortDirection])

  const getSortTooltip = (column: CostPoolSortableColumn): string => {
    if (sortBy !== column) return "Click to sort ascending"
    if (sortDirection === COST_POOL_SORT_DIRECTION.ASC) return "Click to sort descending"
    if (sortDirection === COST_POOL_SORT_DIRECTION.DESC) return "Click to cancel sorting"
    return "Click to sort ascending"
  }

  const getSortStateForColumn = (column: CostPoolSortableColumn): CostPoolSortState => {
    if (sortBy !== column || !sortDirection) return COST_POOL_SORT_STATE.NONE
    return sortDirection
  }

  const handleSortToggle = (column: CostPoolSortableColumn) => {
    if (sortBy !== column) {
      setSortBy(column)
      setSortDirection(COST_POOL_SORT_DIRECTION.ASC)
      return
    }

    if (sortDirection === COST_POOL_SORT_DIRECTION.ASC) {
      setSortDirection(COST_POOL_SORT_DIRECTION.DESC)
      return
    }

    if (sortDirection === COST_POOL_SORT_DIRECTION.DESC) {
      setSortBy(null)
      setSortDirection(null)
      return
    }

    setSortDirection(COST_POOL_SORT_DIRECTION.ASC)
  }

  return (
    <div className="space-y-4 rounded-[10px] border border-[#E5E7EB] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] p-3">
        <div className="w-full max-w-[300px]">
          <form onSubmit={(event) => event.preventDefault()} className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
            <TitleCaseInput
              placeholder="Search here"
              className="h-12 rounded-[8px] border border-[#D9D9D9] bg-white pl-9 text-[16px] text-[#1F2937] placeholder:text-[#9CA3AF]"
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
            className="flex h-12 items-center gap-2 rounded-[12px] bg-[#6C5DD3] px-4 text-white"
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

          {canAddCostPool && (
            <Button
              type="button"
              onClick={() => setAddOpen(true)}
              className="h-12 rounded-[12px] bg-[#6C5DD3] px-6 text-[14px] font-normal text-white hover:bg-[#5B4DC5]"
            >
              <PlusIcon className="mr-2 size-4" />
              Add Cost Pool
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[8px] border border-[#E5E7EB]">
        <Table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[33%]" />
            <col className="w-[32%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
          </colgroup>
          <TableHeader>
            <TableRow className="h-[48px] bg-[#6C5DD3] hover:bg-[#6C5DD3]">
              {["Cost Pool", "Department", "Active", "Action"].map((column) => (
                <TableHead
                  key={column}
                  className={`h-[48px] align-middle border-r border-[#FFFFFF66] bg-[#6C5DD3] px-[12px] py-[8px] text-[14px] font-[400] leading-[1.2] whitespace-normal break-normal text-white font-['Roboto',sans-serif] last:border-r-0 ${
                    ["Department", "Active", "Action"].includes(column)
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {column === "Cost Pool" ? (
                    <TooltipProvider>
                      <Tooltip
                        open={
                          openTooltipColumn ===
                          "costPool"
                        }
                      >
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() =>
                              handleSortToggle(
                                "costPool"
                              )
                            }
                            onMouseEnter={() =>
                              setOpenTooltipColumn(
                                "costPool"
                              )
                            }
                            onMouseLeave={() => setOpenTooltipColumn(null)}
                            onFocus={() =>
                              setOpenTooltipColumn(
                                "costPool"
                              )
                            }
                            onBlur={() => setOpenTooltipColumn(null)}
                            className="flex h-full w-full cursor-pointer items-center justify-between gap-2 text-left font-[400]"
                          >
                            <span className="max-w-full whitespace-normal break-normal font-[400]">
                              {column}
                            </span>
                            <span className="ml-1 inline-flex shrink-0 flex-col items-center leading-none">
                              <span
                                className={`h-0 w-0 border-b-[6px] border-l-[5px] border-r-[5px] border-l-transparent border-r-transparent ${
                                  getSortStateForColumn("costPool") === "asc"
                                    ? "border-b-[#1E8BFF]"
                                    : "border-b-white"
                                }`}
                              />
                              <span
                                className={`mt-1 h-0 w-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent ${
                                  getSortStateForColumn("costPool") === "desc"
                                    ? "border-t-[#1E8BFF]"
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
                            "costPool"
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
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[6px] align-top text-left">
                    <Skeleton className="h-4 w-[70%]" />
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[6px] align-top text-center">
                    <Skeleton className="h-4 w-[65%]" />
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[6px] align-middle text-center">
                    <Skeleton className="mx-auto h-4 w-4" />
                  </TableCell>
                  <TableCell className="px-[14px] py-[6px] align-middle text-center">
                    <Skeleton className="mx-auto h-6 w-6" />
                  </TableCell>
                </TableRow>
              ))
            ) : sortedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-20 text-center text-sm text-muted-foreground"
                >
                  No cost pools found.
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.map((row) => (
                <TableRow key={row.id} className="border-b border-[#E5E7EB]">
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[6px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    {row.costPool}
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[6px] align-top text-center text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    {row.department}
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[6px] align-middle text-center">
                    {row.active ? (
                      <img
                        src={statusCheckImg}
                        alt="active"
                        className="mx-auto h-4 w-4 object-contain"
                      />
                    ) : null}
                  </TableCell>
                  <TableCell className="px-[14px] py-[6px] align-middle text-center">
                    {canUpdateCostPool && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                        onClick={() => {
                          setRowToEdit(row)
                          setEditOpen(true)
                        }}
                      >
                        <img
                          src={editIconImg}
                          alt="Edit"
                          className="h-4 w-4 object-contain"
                        />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          showClose={false}
          overlayClassName="bg-black/50"
          className="max-h-[90vh] w-[1240px] max-w-[calc(100vw-2rem)] overflow-y-auto border-0 bg-transparent p-0 shadow-none outline-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none"
        >
          <div className="flex w-full justify-center">
            <CostPoolCreateDialogContent
              onClose={() => setAddOpen(false)}
              onCreated={() => {
                onPageChange(1)
                navigate("/costpool", { replace: true })
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setRowToEdit(null)
        }}
      >
        <DialogContent
          showClose={false}
          overlayClassName="bg-black/50"
          className="max-h-[90vh] w-[1240px] max-w-[calc(100vw-2rem)] overflow-y-auto border-0 bg-transparent p-0 shadow-none outline-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none"
        >
          {rowToEdit ? (
            <div className="flex w-full justify-center">
              <CostPoolEditDialogContent
                key={rowToEdit.id}
                costPoolId={rowToEdit.id}
                onClose={() => {
                  setEditOpen(false)
                  setRowToEdit(null)
                }}
                onUpdated={() => {
                  navigate("/costpool", { replace: true })
                }}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
