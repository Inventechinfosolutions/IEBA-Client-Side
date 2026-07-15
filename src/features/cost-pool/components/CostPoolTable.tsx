import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, History, PlusIcon, SearchIcon, X, Eye } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"

import { guardNoChanges } from "@/lib/formGuard"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
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
import { useGetDepartments, useGetAllDepartments } from "@/features/department/queries/getDepartments"
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
import { useCostPoolUserPicklistQuery } from "../queries/getCostPoolUserPicklist"
import { CostPoolHistoryTable } from "./CostPoolHistoryTable"
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
  CostPoolActivitySummaryResDto,
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
      allowUserCostpoolDirect: d.settings.allowUserCostpoolDirect,
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
  const userPicklist = useCostPoolUserPicklistQuery(departmentId, {
    enabled: departmentId > 0,
  })
  const userRows = userPicklist.data?.users ?? []
  const allowUserOrCostpoolDirect = userPicklist.data?.allowUserOrCostpoolDirect ?? true
  const createMutation = useCreateCostPool()

  const submit = form.handleSubmit((values) => {
    if (guardNoChanges(values, costPoolUpsertDefaultValues)) return
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
      userRows={userRows}
      usersLoading={userPicklist.isPending && departmentId > 0}
      allowUserOrCostpoolDirect={allowUserOrCostpoolDirect}
      isSubmitting={createMutation.isPending}
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
  userRows,
  usersLoading,
  departmentOptions,
  departmentsLoading,
  onClose,
  onUpdated,
  allowUserOrCostpoolDirect,
  isLoadingDetails,
  readOnly,
}: {
  costPoolId: number
  detail: CostPoolDetailResDto
  activityRows: CostPoolActivityPickRow[]
  activitiesLoading: boolean
  userRows: any[]
  usersLoading: boolean
  departmentOptions: CostPoolDepartmentOption[]
  departmentsLoading: boolean
  onClose: () => void
  onUpdated: () => void
  allowUserOrCostpoolDirect: boolean
  isLoadingDetails?: boolean
  readOnly?: boolean
}) {
  const initialValues = useMemo(() => detailToUpsertFormValues(detail), [detail])

  const form = useForm<CostPoolUpsertFormValues>({
    resolver: zodResolver(costPoolUpsertFormSchema),
    values: initialValues,
  })

  const updateMutation = useUpdateCostPool()

  const submit = form.handleSubmit((values) => {
    if (guardNoChanges(values, initialValues)) {
      return
    }
    updateMutation.mutate(
      { 
        id: costPoolId, 
        values, 
        initialValues,
        oldAssignedUsers: detail.assignedUsers,
        oldAssignedActivities: detail.assignedActivities,
      },
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
      userRows={userRows}
      usersLoading={usersLoading}
      allowUserOrCostpoolDirect={allowUserOrCostpoolDirect}
      isSubmitting={updateMutation.isPending}
      isLoadingDetails={isLoadingDetails}
      readOnly={readOnly}
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

  const departmentOptions = useMemo(() => {
    if (!detailQuery.data?.department) return []
    const d = detailQuery.data.department
    return [
      {
        id: String(d.id),
        name: d.name,
        allowUserCostpoolDirect: (d as any).allowUserOrCostpoolDirect,
      },
    ]
  }, [detailQuery.data?.department])

  const activityRows = useMemo(() => {
    if (!detailQuery.data) return []
    return mergeDetailActivitiesToPickRows(detailQuery.data)
  }, [detailQuery.data])

  const userRows = useMemo(() => {
    if (!detailQuery.data) return []
    
    const detailAssigned = (detailQuery.data.assignedUsers ?? []).map((u) => ({
      userId: String(u.id),
      displayName: u.name?.trim() || [u.firstName, u.lastName].filter(Boolean).join(" ") || String(u.id),
    }))
    const detailUnassigned = (detailQuery.data.unassignedUsers ?? []).map((u) => ({
      userId: String(u.id),
      displayName: u.name?.trim() || [u.firstName, u.lastName].filter(Boolean).join(" ") || String(u.id),
    }))

    const combined = [...detailAssigned, ...detailUnassigned]
    const map = new Map<string, any>()
    for (const u of combined) {
      if (u.userId) map.set(u.userId, u)
    }
    return Array.from(map.values())
  }, [detailQuery.data])

  const allowUserOrCostpoolDirect = useMemo(() => {
    return (detailQuery.data?.department as any)?.allowUserOrCostpoolDirect ?? true
  }, [detailQuery.data])

  const readOnly = useMemo(() => {
    return detailQuery.data?.name?.endsWith("StandbyCostPool") ?? false
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
      <div className="relative flex min-h-[400px] w-full max-w-[1150px] items-center justify-center rounded-[10px] bg-white p-8 shadow-[0_0_20px_0_#0000001a]">
        <Spinner className="text-[#6C5DD3]" />
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
      userRows={userRows}
      usersLoading={detailQuery.isFetching}
      allowUserOrCostpoolDirect={allowUserOrCostpoolDirect}
      isLoadingDetails={detailQuery.isFetching}
      departmentOptions={departmentOptions}
      departmentsLoading={false}
      onClose={onClose}
      onUpdated={onUpdated}
      readOnly={readOnly}
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
  onDepartmentChange,
  onPageChange,
  onPageSizeChange,
}: CostPoolTableProps) {
  const { canAdd, canUpdate, isSuperAdmin } = usePermissions()
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

  const [showHistory, setShowHistory] = useState(false)
  const [historyActivityCode, setHistoryActivityCode] = useState("")
  const [historyAssignmentKind, setHistoryAssignmentKind] = useState("")

  // Lazy-fetch departments only when the dropdown is opened
  const [deptFetchEnabled, setDeptFetchEnabled] = useState(false)
  const allDepartmentsQuery = useGetAllDepartments(
    { status: "active" },
    { enabled: deptFetchEnabled },
  )
  const departmentOptions = useMemo(() => {
    const items = allDepartmentsQuery.data?.items ?? []
    return [
      { value: "__all__", label: "All Departments" },
      ...items.map((d) => ({ value: String(d.id), label: d.name })),
    ]
  }, [allDepartmentsQuery.data])

  const handleDeptOpenChange = (open: boolean) => {
    if (open) setDeptFetchEnabled(true) // trigger API on first open
  }

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
        {showHistory ? (
          <div className="flex flex-1 items-center gap-2">
            <TitleCaseInput
              placeholder="Search Activity Code"
              value={historyActivityCode}
              onChange={(e) => setHistoryActivityCode(e.target.value)}
              className="h-12 w-[220px] rounded-[10px] border border-[#D9D9D9] bg-white px-3.5 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#9CA3AF] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
            />
            <TitleCaseInput
              placeholder="Search Assignment Kind"
              value={historyAssignmentKind}
              onChange={(e) => setHistoryAssignmentKind(e.target.value)}
              className="h-12 w-[220px] rounded-[10px] border border-[#D9D9D9] bg-white px-3.5 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#9CA3AF] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Search bar */}
            <div className="w-full max-w-[260px]">
              <form onSubmit={(event) => event.preventDefault()} className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
                <TitleCaseInput
                  placeholder="Search here"
                  className="h-12 rounded-[8px] border border-[#D9D9D9] bg-white pl-9 pr-9 text-[16px] text-[#1F2937] placeholder:text-[#9CA3AF]"
                  {...filterForm.register("search")}
                  value={searchValue}
                  onChange={(event) => {
                    filterForm.setValue("search", event.target.value)
                    onSearchChange(event.target.value)
                    onPageChange(1)
                  }}
                />
                {searchValue && searchValue.length > 0 && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#111827] cursor-pointer"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      filterForm.setValue("search", "")
                      onSearchChange("")
                      onPageChange(1)
                    }}
                  >
                    <X className="size-4" />
                  </button>
                )}
              </form>
            </div>

            {/* Department filter dropdown */}
            <SingleSelectDropdown
              value={filters.departmentId !== undefined ? String(filters.departmentId) : ""}
              onChange={(val) => {
                const deptId = val === "__all__" || val === "" ? undefined : val
                onDepartmentChange(deptId)
                onPageChange(1)
              }}
              onBlur={() => {}}
              options={departmentOptions}
              placeholder="Filter by Department"
              isLoading={allDepartmentsQuery.isPending && deptFetchEnabled}
              onOpenChange={handleDeptOpenChange}
            />
          </div>
        )}

        <div className="flex items-center gap-3 ml-auto">
          {isSuperAdmin && (
            <button
              type="button"
              className={`flex h-12 items-center gap-2 rounded-[12px] px-4 text-[14px] font-normal transition-colors ${
                showHistory
                  ? "bg-[#6C5DD3] text-white"
                  : "border border-[#6C5DD3] bg-white text-[#6C5DD3] hover:bg-[#F3F0FF]"
              }`}
              onClick={() => {
                setShowHistory((prev) => {
                  if (prev) {
                    filterForm.setValue("search", "")
                    onSearchChange("")
                    setHistoryActivityCode("")
                    setHistoryAssignmentKind("")
                  }
                  return !prev
                })
              }}
            >
              {showHistory ? (
                <>
                  <ArrowLeft className="size-4 animate-back-bounce" />
                  Back to Cost Pool
                </>
              ) : (
                <>
                  <History className="size-4" />
                  History
                </>
              )}
            </button>
          )}

          {!showHistory && (
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
          )}

          {!showHistory && canAddCostPool && (
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

      {showHistory && (
        <CostPoolHistoryTable
          activityCode={historyActivityCode}
          assignmentKind={historyAssignmentKind}
        />
      )}

      <div className={`overflow-hidden rounded-[8px] border border-[#E5E7EB] ${showHistory ? "hidden" : ""}`}>
        <Table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[18%]" />
            <col className="w-[46%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
          </colgroup>
          <TableHeader>
            <TableRow className="h-[48px] bg-[#6C5DD3] hover:bg-[#6C5DD3]">
              {["Cost Pool", "Department", "Activities", "Active", "Action"].map((column) => (
                <TableHead
                  key={column}
                  className={`h-[48px] align-middle border-r border-[#FFFFFF66] bg-[#6C5DD3] px-[12px] py-[8px] text-[14px] font-normal leading-[1.2] whitespace-normal break-normal text-white font-['Roboto',sans-serif] last:border-r-0 ${
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
                            className="flex h-full w-full cursor-pointer items-center justify-between gap-2 text-left font-normal"
                          >
                            <span className="max-w-full whitespace-normal break-normal font-normal">
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
                    <span className="inline-flex h-full items-center max-w-full whitespace-normal break-normal font-normal">
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
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[6px] align-top text-left">
                    <Skeleton className="h-4 w-[80%]" />
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
                  colSpan={5}
                  className="h-20 text-center text-sm text-muted-foreground"
                >
                  No cost pools found.
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.map((row) => (
                <TableRow key={row.id} className="border-b border-[#E5E7EB]">
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[6px] align-middle text-left text-[14px] font-normal font-['Roboto',sans-serif] text-[#000000E0] whitespace-normal wrap-break-word">
                    {row.costPool}
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[6px] align-middle text-center text-[14px] font-normal font-['Roboto',sans-serif] text-[#000000E0] whitespace-normal wrap-break-word">
                    {row.department}
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[6px] align-middle text-center text-[14px] font-normal font-['Roboto',sans-serif] text-[#000000E0]">
                    <ActivitiesCell activities={row.activities} />
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
                        {row.costPool.endsWith("StandbyCostPool") ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <img
                            src={editIconImg}
                            alt="Edit"
                            className="h-4 w-4 object-contain"
                          />
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {!showHistory && (
        <div className="mt-4">
          <MasterCodePagination
            totalItems={totalItems}
            currentPage={pagination.page}
            pageSize={pagination.pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}

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
                }}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ActivitiesCell({ activities }: { activities: CostPoolActivitySummaryResDto[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (activities.length === 0) {
    return <span className="text-[#9CA3AF]">N/A</span>
  }

  const visibleActivities = isExpanded ? activities : activities.slice(0, 3)
  const hasMore = activities.length > 3

  return (
    <div className="flex flex-col gap-1.5 align-middle">
      <div className="flex flex-wrap gap-1.5 justify-center">
        {visibleActivities.map((activity) => {
          const code = String(activity.code ?? "").trim()
          const name = String(activity.name ?? "").trim()
          const displayName = code && name ? `${code} - ${name}` : (code || name)
          const isInactive = activity.status?.toLowerCase() === "inactive"
          return (
            <span
              key={activity.id}
              className={`inline-flex items-center rounded-[7px] bg-[#f8f9fa] dark:bg-[#1c192d] px-1.5 py-0.5 text-[10px] text-[#232735] dark:text-[#e4e4e7] ${
                isInactive
                  ? "border border-red-400 text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400"
                  : "border border-[#d8dae3] dark:border-[rgba(108,93,211,0.5)]!"
              }`}
            >
              {displayName}
            </span>
          )
        })}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#6C5DD3] hover:underline text-[11px] font-medium mt-1 inline-block text-center cursor-pointer"
        >
          {isExpanded ? "Show Less" : `+ ${activities.length - 3} more`}
        </button>
      )}
    </div>
  )
}
