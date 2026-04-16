import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, ChevronRight, PlusIcon, SearchIcon } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useMemo, useRef, useState } from "react"
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
import {
  CountyActivityAddPageMode,
  CountyActivityGridRowType,
  CountyActivityTablePageSizeOptions,
} from "../enums/CountyActivity.enum"
import type {
  CountyActivityCodeRow,
  CountyActivityAddFormValues,
  CountyActivityCodeSortableColumn,
  CountyActivityCodeSortDirection,
  CountyActivityCodeTableProps,
  CountyActivityDepartmentStackProps,
  CountyActivityDescriptionTableCellProps,
  CountyActivityFilterFormValues,
  CountyActivitySubFlowPrimaryDefaults,
} from "../types"
import statusCheckImg from "@/assets/status-check.png"
import statusCrossImg from "@/assets/status-cross.png"
import editIconImg from "@/assets/edit-icon.png"
import { useUpdateCountyActivityCode } from "../mutations/updateCountyActivityCode"
import { useCreateCountyActivityCode } from "../mutations/createCountyActivityCode"
import { ActivityStatusEnum } from "@/features/master-code/enums/activityStatus"

import { useGetMasterCodeOptions } from "@/features/department/queries/getMasterCodeOptions"

import { COUNTY_ACTIVITY_SEARCH_DEBOUNCE_MS } from "../constants"
import { countyActivityCodeKeys } from "../keys"
import {
  useGetCountyActivityForEdit,
  useGetCountyActivityMasterCodes,
} from "../queries/getCountyActivityCodes"
import { usePermissions } from "@/hooks/usePermissions"

function toastCountyActivityCodeApiError(err: unknown, fallback: string): void {
  const msg = err instanceof Error ? err.message.trim() : ""
  toast.error(msg.length > 0 ? msg : fallback)
}

function getCountyActivityCodeRowDepartmentLabel(row: CountyActivityCodeRow): string {
  const dept = row.department?.trim() ?? ""
  return dept.length > 0 ? dept : "—"
}

/** Renders comma-separated department labels one per line (UAT-style). */
function CountyActivityDepartmentStackCell({ label }: CountyActivityDepartmentStackProps) {
  const raw = label.trim()
  if (raw === "") return null
  if (raw === "—") return <span>—</span>
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) return <span>—</span>
  if (parts.length === 1) {
    return <span className="leading-[1.35]">{parts[0]}</span>
  }
  return (
    <ul className="m-0 list-none space-y-1.5 p-0">
      {parts.map((name, i) => (
        <li key={`${name}-${i}`} className="leading-[1.35]">
          {name}
        </li>
      ))}
    </ul>
  )
}

/** Single-line ellipsis in the grid; full text in a square tooltip (scroll if long). */
function CountyActivityDescriptionTableCell({
  description,
}: CountyActivityDescriptionTableCellProps) {
  const text = description ?? ""
  return (
    <TableCell className="min-w-0 max-w-0 border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block min-w-0 max-w-full cursor-default overflow-hidden text-ellipsis whitespace-nowrap">
              {text || "—"}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="center"
            sideOffset={6}
            className="z-50 !inline-block max-h-[min(20rem,70vh)] max-w-[min(20rem,70vw)] overflow-y-auto rounded-[8px] border-0 bg-black px-3 py-2.5 text-left text-[12px] font-medium leading-relaxed text-white shadow-lg"
          >
            <span className="block whitespace-normal break-words">
              {text.trim() ? text : "—"}
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  )
}

export function CountyActivityCodeTable({
  rows,
  primaryRows,
  activePrimaryCountyRows,
  subCountyParentPickerRows,
  subRowsByParentId,
  pagination,
  totalItems,
  departments,
  isLoading = false,
  filters,
  onSearchChange,
  onInactiveChange,
  onPageChange,
  onPageSizeChange,
}: CountyActivityCodeTableProps) {
  const queryClient = useQueryClient()
  const { canAdd, canUpdate } = usePermissions()
  const canAddCountyActivity = canAdd("countyactivity")
  const canUpdateCountyActivity = canUpdate("countyactivity")

  const searchDebounceTimerRef = useRef<number | null>(null)

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

  const showInactive = filterForm.watch("inactive")
  const searchValue = filterForm.watch("search")
  const totalPages = Math.max(1, pagination.totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [rowToEdit, setRowToEdit] = useState<CountyActivityCodeRow | null>(null)
  const [addTab, setAddTab] = useState<CountyActivityGridRowType>(
    CountyActivityGridRowType.PRIMARY,
  )
  /** Remount add modal so Code Type / Code Selects reflect `reset()` after save or reopen. */
  const [addFormMountKey, setAddFormMountKey] = useState(0)
  const [currentPrimaryId, setCurrentPrimaryId] = useState<string | null>(null)
  const [currentPrimaryDefaults, setCurrentPrimaryDefaults] =
    useState<CountyActivitySubFlowPrimaryDefaults | null>(null)

  const addSubParentDetailQuery = useGetCountyActivityForEdit(
    currentPrimaryId,
    addOpen &&
      addTab === CountyActivityGridRowType.SUB &&
      Boolean(currentPrimaryId?.trim()),
  )

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

  const addMasterCodeType = addForm.watch("masterCodeType")

  const tenantMasterCodeTypeNamesQuery = useGetMasterCodeOptions(
    addOpen || editOpen,
  )

  const editActivityId = editOpen && rowToEdit ? rowToEdit.id : null
  const editDetailQuery = useGetCountyActivityForEdit(editActivityId, editOpen)

  const editSyncedMasterCodeType = useMemo(() => {
    if (!editOpen || !rowToEdit || !editDetailQuery.isSuccess || !editDetailQuery.data) {
      return ""
    }
    const { activity } = editDetailQuery.data
    if (activity.id !== Number(rowToEdit.id)) return ""
    if (rowToEdit.rowType === CountyActivityGridRowType.PRIMARY) {
      return activity.activityCodeType.trim()
    }
    const parent =
      rowToEdit.parentId != null
        ? primaryRows.find((r) => r.id === rowToEdit.parentId) ?? null
        : null
    return (parent?.masterCodeType ?? rowToEdit.masterCodeType).trim()
  }, [editOpen, rowToEdit, editDetailQuery.isSuccess, editDetailQuery.data, primaryRows])

  const editHydrationCodesQuery = useGetCountyActivityMasterCodes(
    editSyncedMasterCodeType,
    editOpen &&
      rowToEdit?.rowType === CountyActivityGridRowType.PRIMARY &&
      editDetailQuery.isSuccess &&
      editSyncedMasterCodeType.length > 0,
  )

  const resolvedEditMasterCodeId = useMemo(() => {
    if (!editOpen || !rowToEdit || rowToEdit.rowType !== CountyActivityGridRowType.PRIMARY) {
      return 0
    }
    const items = editHydrationCodesQuery.data?.items ?? []
    const code = rowToEdit.catalogActivityCode.trim()
    if (!code || items.length === 0) return 0
    const hit = items.find((m) => (m.code ?? "").trim() === code)
    return hit ? Number(hit.id) : 0
  }, [
    editOpen,
    rowToEdit?.rowType,
    rowToEdit?.catalogActivityCode,
    editHydrationCodesQuery.data?.items,
  ])

  const editFormValuesFromServer = useMemo((): CountyActivityAddFormValues | undefined => {
    if (!editOpen || !rowToEdit || !editDetailQuery.isSuccess || !editDetailQuery.data) {
      return undefined
    }
    const { activity, departmentNames: editDeptNames } = editDetailQuery.data
    if (activity.id !== Number(rowToEdit.id)) return undefined

    const parent =
      rowToEdit.rowType === CountyActivityGridRowType.SUB && rowToEdit.parentId
        ? primaryRows.find((r) => r.id === rowToEdit.parentId) ?? null
        : null

    if (rowToEdit.rowType === CountyActivityGridRowType.PRIMARY) {
      return {
        copyCode: false,
        countyActivityCode: activity.code,
        countyActivityName: activity.name,
        description: (activity.description ?? "").trim(),
        masterCodeType: activity.activityCodeType,
        masterCode: resolvedEditMasterCodeId,
        match: rowToEdit.match,
        percentage: rowToEdit.percentage,
        active: activity.status === ActivityStatusEnum.ACTIVE,
        leaveCode: activity.leavecode,
        docRequired: activity.docrequired,
        multipleJobPools: activity.isActivityAssignableToMultipleJobPools,
        department: editDeptNames.join(", "),
      }
    }

    return {
      copyCode: false,
      countyActivityCode: activity.code,
      countyActivityName: activity.name,
      description: (activity.description ?? "").trim(),
      masterCodeType: parent?.masterCodeType ?? rowToEdit.masterCodeType,
      masterCode: 0,
      match: rowToEdit.match,
      percentage: rowToEdit.percentage,
      active: activity.status === ActivityStatusEnum.ACTIVE,
      leaveCode: activity.leavecode,
      docRequired: activity.docrequired,
      multipleJobPools: activity.isActivityAssignableToMultipleJobPools,
      department:
        editDeptNames.length > 0 ? editDeptNames.join(", ") : rowToEdit.department,
    }
  }, [
    editOpen,
    rowToEdit,
    editDetailQuery.isSuccess,
    editDetailQuery.data,
    primaryRows,
    resolvedEditMasterCodeId,
  ])

  const editForm = useForm<CountyActivityAddFormValues>({
    resolver: zodResolver(countyActivityAddFormSchema),
    defaultValues: countyActivityAddDefaultValues,
    ...(editFormValuesFromServer !== undefined
      ? { values: editFormValuesFromServer }
      : {}),
  })

  const editMasterCodeTypeWatched = editForm.watch("masterCodeType")
  const editMasterCodesQuery = useGetCountyActivityMasterCodes(
    editMasterCodeTypeWatched.trim() !== ""
      ? editMasterCodeTypeWatched
      : editSyncedMasterCodeType,
    editOpen &&
      rowToEdit != null &&
      rowToEdit.rowType !== CountyActivityGridRowType.SUB,
  )

  const addMasterCodesQuery = useGetCountyActivityMasterCodes(
    addMasterCodeType,
    addOpen && addTab === CountyActivityGridRowType.PRIMARY,
  )

  const addMasterCodeOptions = useMemo(
    () =>
      (addMasterCodesQuery.data?.items ?? []).map((item) => ({
        label: item.code ? `${item.code} * ${item.name}` : item.name,
        value: Number(item.id),
        code: String(item.code ?? "").trim(),
      })).filter((o) => o.code.length > 0),
    [addMasterCodesQuery.data?.items],
  )

  const editMasterCodeOptions = useMemo(
    () =>
      (editMasterCodesQuery.data?.items ?? []).map((item) => ({
        label: item.code ? `${item.code} * ${item.name}` : item.name,
        value: Number(item.id),
        code: String(item.code ?? "").trim(),
      })).filter((o) => o.code.length > 0),
    [editMasterCodesQuery.data?.items],
  )

  const departmentNames = useMemo(() => {
    return departments
      .map((d) => d.name.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  }, [departments])

  const departmentIdByName = useMemo(() => {
    const map: Record<string, number> = {}
    for (const d of departments) {
      const id = Number(d.id)
      const name = d.name.trim()
      if (!Number.isNaN(id) && name) map[name] = id
    }
    return map
  }, [departments])

  const formatCountyActivityPrimaryPickerOptionLabel = (row: CountyActivityCodeRow): string => {
    const full = `${row.countyActivityCode} - ${row.countyActivityName}`
    return full.length > 42 ? row.countyActivityCode : full
  }

  const addModalPrimaryActivityOptions = useMemo(
    () =>
      subCountyParentPickerRows.map((row) => ({
        label: formatCountyActivityPrimaryPickerOptionLabel(row),
        value: row.id,
      })),
    [subCountyParentPickerRows],
  )

  const editModalPrimaryActivityOptions = useMemo(() => {
    const base = [...addModalPrimaryActivityOptions]
    if (rowToEdit?.rowType === CountyActivityGridRowType.SUB && rowToEdit.parentId) {
      const pid = rowToEdit.parentId
      if (!base.some((o) => o.value === pid)) {
        const parent = primaryRows.find((r) => r.id === pid)
        if (parent) {
          return [
            { label: formatCountyActivityPrimaryPickerOptionLabel(parent), value: parent.id },
            ...base,
          ]
        }
      }
    }
    return base
  }, [addModalPrimaryActivityOptions, rowToEdit, primaryRows])

  const findCountyActivityRowForSubParentPickerById = (
    id: string,
  ): CountyActivityCodeRow | undefined =>
    subCountyParentPickerRows.find((r) => r.id === id) ??
    activePrimaryCountyRows.find((r) => r.id === id) ??
    primaryRows.find((r) => r.id === id)

  const submitCreateCountyActivityFromAddModal = (
    tab: CountyActivityGridRowType,
    values: CountyActivityAddFormValues,
  ) => {
    const assignedNames = values.department
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const departmentLinks = assignedNames
      .map((name) => departmentIdByName[name])
      .filter((id): id is number => typeof id === "number" && !Number.isNaN(id))
      .map((id) => ({ id }))

    if (tab === CountyActivityGridRowType.PRIMARY) {
      if (values.masterCode <= 0) {
        toast.error("Select a master code")
        return
      }
      const catalog = addMasterCodeOptions.find((o) => o.value === values.masterCode)
      if (!catalog?.code) {
        toast.error("Select a valid master code")
        return
      }
    }

    const masterCatalog =
      tab === CountyActivityGridRowType.PRIMARY
        ? {
            code: addMasterCodeOptions.find((o) => o.value === values.masterCode)?.code ?? "",
            type: values.masterCodeType,
          }
        : undefined

    if (
      tab === CountyActivityGridRowType.PRIMARY &&
      (!masterCatalog?.code || !masterCatalog.type)
    ) {
      toast.error("Select a valid master code")
      return
    }

    createCountyActivityCode.mutate(
      {
        values,
        tab,
        parentId: tab === CountyActivityGridRowType.SUB ? currentPrimaryId : null,
        masterCatalog:
          tab === CountyActivityGridRowType.PRIMARY && masterCatalog?.code
            ? { code: masterCatalog.code, type: masterCatalog.type }
            : undefined,
        departmentLinks:
          tab === CountyActivityGridRowType.PRIMARY ? departmentLinks : [],
      },
      {
        onSuccess: () => {
          toast.success(
            tab === CountyActivityGridRowType.PRIMARY
              ? "Primary county activity created successfully."
              : "Secondary county activity created successfully.",
          )

          if (tab === CountyActivityGridRowType.PRIMARY) {
            setAddTab(CountyActivityGridRowType.PRIMARY)
            addForm.reset(
              { ...countyActivityAddDefaultValues },
              { keepDirty: false, keepTouched: false, keepErrors: false },
            )
            setAddFormMountKey((k) => k + 1)
            setCurrentPrimaryId(null)
            setCurrentPrimaryDefaults({
              masterCodeType: values.masterCodeType,
              masterCode: values.masterCode,
              department: values.department,
            })
            return
          }

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
        onError: (err) => {
          toastCountyActivityCodeApiError(
            err,
            tab === CountyActivityGridRowType.PRIMARY
              ? "Could not create primary county activity."
              : "Could not create secondary county activity.",
          )
        },
      },
    )
  }

  const submitCountyActivityEditFromEditModal = editForm.handleSubmit((values) => {
    if (!rowToEdit) return

    let masterCatalog: { code: string; type: string } | undefined
    if (rowToEdit.rowType === CountyActivityGridRowType.PRIMARY) {
      if (values.masterCode <= 0) {
        toast.error("Select a master code")
        return
      }
      const catalog = editMasterCodeOptions.find((o) => o.value === values.masterCode)
      if (!catalog?.code) {
        toast.error("Select a valid master code")
        return
      }
      masterCatalog = { code: catalog.code, type: values.masterCodeType }
    }

    const editAssignedNames = values.department
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const editDepartmentLinks = editAssignedNames
      .map((name) => departmentIdByName[name])
      .filter((id): id is number => typeof id === "number" && !Number.isNaN(id))
      .map((id) => ({ id }))

    const editingRow = rowToEdit

    updateCountyActivityCode.mutate(
      {
        id: editingRow.id,
        values,
        rowType: editingRow.rowType,
        masterCatalog,
        departmentLinks:
          editingRow.rowType === CountyActivityGridRowType.PRIMARY
            ? editDepartmentLinks
            : undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            editingRow.rowType === CountyActivityGridRowType.PRIMARY
              ? "Primary county activity updated successfully."
              : "Secondary county activity updated successfully.",
          )
          editForm.reset()
          setEditOpen(false)
          setRowToEdit(null)
        },
        onError: (err) => {
          toastCountyActivityCodeApiError(
            err,
            editingRow.rowType === CountyActivityGridRowType.PRIMARY
              ? "Could not update primary county activity."
              : "Could not update secondary county activity.",
          )
        },
      },
    )
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

  const getCountyActivityTableSortColumnTooltip = (
    column: CountyActivityCodeSortableColumn,
  ): string => {
    if (sortBy !== column) return "Click to sort ascending"
    if (sortDirection === "asc") return "Click to sort descending"
    if (sortDirection === "desc") return "Click to cancel sorting"
    return "Click to sort ascending"
  }

  const toggleCountyActivityTableSortColumn = (column: CountyActivityCodeSortableColumn) => {
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
                const next = event.target.value
                filterForm.setValue("search", next)
                if (searchDebounceTimerRef.current !== null) {
                  window.clearTimeout(searchDebounceTimerRef.current)
                }
                searchDebounceTimerRef.current = window.setTimeout(() => {
                  searchDebounceTimerRef.current = null
                  onSearchChange(next)
                  onPageChange(1)
                }, COUNTY_ACTIVITY_SEARCH_DEBOUNCE_MS)
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
          {canAddCountyActivity && (
            <Button
              type="button"
              onClick={() => {
                setAddTab(CountyActivityGridRowType.PRIMARY)
                setCurrentPrimaryId(null)
                setCurrentPrimaryDefaults(null)
                addForm.reset(
                  { ...countyActivityAddDefaultValues },
                  { keepDirty: false, keepTouched: false, keepErrors: false },
                )
                setAddFormMountKey((k) => k + 1)
                setAddOpen(true)
              }}
              className="h-12 rounded-[10px] bg-[#6C5DD3] px-6 text-[14px] font-normal text-white hover:bg-[#5B4DC5]"
            >
              <PlusIcon className="mr-2 size-4" />
              Add County Activity
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB]">
        <Table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className={canUpdateCountyActivity ? "w-[9%]" : "w-[10%]"} /> {/* Code */}
            <col className={canUpdateCountyActivity ? "w-[13%]" : "w-[15%]"} /> {/* Name */}
            <col className={canUpdateCountyActivity ? "w-[12%]" : "w-[15%]"} /> {/* Desc */}
            <col className={canUpdateCountyActivity ? "w-[9%]" : "w-[10%]"} /> {/* Dept */}
            <col className={canUpdateCountyActivity ? "w-[8%]" : "w-[9%]"} /> {/* Type */}
            <col className={canUpdateCountyActivity ? "w-[6%]" : "w-[7%]"} /> {/* Code */}
            <col className={canUpdateCountyActivity ? "w-[5%]" : "w-[5%]"} /> {/* SPMP */}
            <col className={canUpdateCountyActivity ? "w-[6%]" : "w-[7%]"} /> {/* Match */}
            <col className={canUpdateCountyActivity ? "w-[4%]" : "w-[5%]"} /> {/* % */}
            <col className={canUpdateCountyActivity ? "w-[6%]" : "w-[7%]"} /> {/* Active */}
            <col className={canUpdateCountyActivity ? "w-[5%]" : "w-[5%]"} /> {/* Leave */}
            <col className={canUpdateCountyActivity ? "w-[8%]" : "w-[5%]"} /> {/* Multiple */}
            {canUpdateCountyActivity && <col className="w-[9%]" />} {/* Action */}
          </colgroup>
          <TableHeader>
            <TableRow className="h-[48px] bg-[#6C5DD3] hover:bg-[#6C5DD3]">
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
                ...(canUpdateCountyActivity ? ["Action"] : []),
              ].map((column, index) => (
                <TableHead
                  key={column}
                  className={`h-[48px] align-middle border-r border-[#FFFFFF66] bg-[#6C5DD3] p-[8px] text-[14px] font-[500] leading-tight whitespace-normal break-normal text-white font-['Roboto',sans-serif] last:border-r-0 ${
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
                              toggleCountyActivityTableSortColumn(column)
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
                          {getCountyActivityTableSortColumnTooltip(
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
                  <TableCell className="min-w-0 max-w-0 border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    <Skeleton className="h-4 w-[100%]" />
                  </TableCell>
                  <TableCell className="min-w-0 border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
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
                  colSpan={canUpdateCountyActivity ? 13 : 12}
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

                const countyActivityPrimaryTableRow = (
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
                  <CountyActivityDescriptionTableCell description={row.description} />
                  <TableCell className="min-w-0 border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] leading-[1.4] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                    <CountyActivityDepartmentStackCell label={getCountyActivityCodeRowDepartmentLabel(row)} />
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
                  {canUpdateCountyActivity && (
                    <TableCell className="px-[14px] py-[5px] align-top text-center">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                        onClick={() => {
                          setRowToEdit(row)
                          editForm.reset({ ...countyActivityAddDefaultValues, copyCode: false })
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
                  )}
                  </TableRow>
                )

                const countyActivitySubTableRows = isExpanded
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
                        <CountyActivityDescriptionTableCell description={child.description} />
                        <TableCell className="min-w-0 border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] leading-[1.4] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          <CountyActivityDepartmentStackCell
                            label={
                              child.rowType === CountyActivityGridRowType.SUB
                                ? ""
                                : getCountyActivityCodeRowDepartmentLabel(child)
                            }
                          />
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          {child.rowType === CountyActivityGridRowType.SUB
                            ? ""
                            : child.masterCodeType}
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          {child.rowType === CountyActivityGridRowType.SUB
                            ? ""
                            : child.masterCode}
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
                        {canUpdateCountyActivity && (
                          <TableCell className="px-[14px] py-[5px] align-top text-center">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                              onClick={() => {
                                setRowToEdit(child)
                                editForm.reset({ ...countyActivityAddDefaultValues, copyCode: false })
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
                        )}
                      </TableRow>
                    ))
                  : []

                return [countyActivityPrimaryTableRow, ...countyActivitySubTableRows]
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
            {CountyActivityTablePageSizeOptions.map((size) => (
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
            key={addFormMountKey}
            form={addForm}
            onAddSave={submitCreateCountyActivityFromAddModal}
            subParentActivityDetail={addSubParentDetailQuery.data ?? null}
            tab={addTab}
            masterCodeTypeOptions={tenantMasterCodeTypeNamesQuery.data ?? []}
            isMasterCodeTypeOptionsLoading={tenantMasterCodeTypeNamesQuery.isLoading}
            masterCodeOptions={addMasterCodeOptions}
            isMasterCodeOptionsLoading={addMasterCodesQuery.isLoading}
            departmentNames={departmentNames}
            onTabChange={(nextTab) => {
              setAddTab(nextTab)
              if (nextTab === CountyActivityGridRowType.SUB) {
                setCurrentPrimaryId(null)
                void queryClient.invalidateQueries({
                  queryKey: countyActivityCodeKeys.activePrimarySubPicker(),
                })
              }
              if (nextTab === CountyActivityGridRowType.SUB && currentPrimaryDefaults) {
                addForm.setValue("masterCodeType", currentPrimaryDefaults.masterCodeType, {
                  shouldValidate: true,
                })
                addForm.setValue("masterCode", currentPrimaryDefaults.masterCode, {
                  shouldValidate: true,
                })
                addForm.setValue("department", currentPrimaryDefaults.department, {
                  shouldValidate: true,
                })
              }
            }}
            primaryActivityCodeOptions={addModalPrimaryActivityOptions}
            selectedPrimaryId={currentPrimaryId}
            onSelectedPrimaryIdChange={(id) => {
              setCurrentPrimaryId(id)
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
          {editDetailQuery.isError && editOpen ? (
            <div
              role="alert"
              className="mb-3 rounded-[10px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-[14px] text-destructive"
            >
              {editDetailQuery.error instanceof Error
                ? editDetailQuery.error.message
                : "Could not load activity for edit."}
            </div>
          ) : null}
          {rowToEdit ? (
            <CountyActivityCodeAddPage
              key={rowToEdit.id}
              mode={CountyActivityAddPageMode.EDIT}
              form={editForm}
              tab={
                rowToEdit.rowType === CountyActivityGridRowType.SUB
                  ? CountyActivityGridRowType.SUB
                  : CountyActivityGridRowType.PRIMARY
              }
              onTabChange={() => {}}
              disabledTabs={{
                primary: rowToEdit.rowType === CountyActivityGridRowType.SUB,
                sub: rowToEdit.rowType !== CountyActivityGridRowType.SUB,
              }}
              primaryActivityCodeOptions={editModalPrimaryActivityOptions}
              selectedPrimaryId={
                rowToEdit.rowType === CountyActivityGridRowType.SUB
                  ? (rowToEdit.parentId ?? null)
                  : null
              }
              readOnlyPrimaryPicker={
                rowToEdit.rowType === CountyActivityGridRowType.SUB
              }
              masterCodeTypeOptions={tenantMasterCodeTypeNamesQuery.data ?? []}
              isMasterCodeTypeOptionsLoading={tenantMasterCodeTypeNamesQuery.isLoading}
              masterCodeOptions={editMasterCodeOptions}
              isMasterCodeOptionsLoading={editMasterCodesQuery.isLoading}
              isEditSourceLoading={editDetailQuery.isPending}
              departmentNames={departmentNames}
              onSelectedPrimaryIdChange={(id) => {
                const selected = findCountyActivityRowForSubParentPickerById(id)
                if (!selected) return
                editForm.setValue("masterCodeType", selected.masterCodeType)
                editForm.setValue("masterCode", selected.masterCode)
                editForm.setValue("department", selected.department)
              }}
              onEditSave={() => {
                void submitCountyActivityEditFromEditModal()
              }}
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
