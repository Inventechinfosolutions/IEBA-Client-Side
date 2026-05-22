import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ChevronDown, ChevronRight, History, OctagonXIcon, PlusIcon, SearchIcon } from "lucide-react"

import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { Spinner } from "@/components/ui/spinner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
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
import { CountyActivityHistoryTable } from "./CountyActivityHistoryTable"
import {
  CountyActivityAddPageMode,
  CountyActivityGridRowType,
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


import { COUNTY_ACTIVITY_SEARCH_DEBOUNCE_MS } from "../constants"
import { countyActivityCodeKeys } from "../keys"
import {
  useGetCountyActivityActivePrimarySubPicker,
  useGetCountyActivityForEdit,
  useGetCountyActivityMasterCodes,
  useGetMasterActivityCatalog,
  useGetNestedActivities,
} from "../queries/getCountyActivityCodes"
import { ACTIVITY_DEFINITION_HISTORY_KIND } from "../queries/activityHistory"
import { apiPutCountyActivity, parseMasterCodeDisplay } from "../api/countyActivityApi"

import { usePermissions } from "@/hooks/usePermissions"
import { useGetDepartments, useGetDepartmentsAll } from "@/features/department/queries/getDepartments"
import { getDepartmentsAll } from "@/features/department/api/departments"

function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function toastCountyActivityCodeApiError(err: unknown, fallback: string): void {
  const msg = err instanceof Error ? err.message.trim() : ""
  toast.error(msg.length > 0 ? msg : fallback, {
    icon: <OctagonXIcon className="size-5 text-red-600" />,
  })
}

type CountyActivityTableColumnConfig = {
  key: string
  labelLines: readonly string[]
  widthWithAction: string
  widthWithoutAction: string
  align?: "left" | "center"
  sortKey?: CountyActivityCodeSortableColumn
}

const COUNTY_ACTIVITY_TABLE_COLUMNS: CountyActivityTableColumnConfig[] = [
  { key: "code", labelLines: ["County Activity", "Code"], widthWithAction: "w-[12%]", widthWithoutAction: "w-[10%]", sortKey: "countyActivityCode" },
  { key: "name", labelLines: ["County Activity", "Name"], widthWithAction: "w-[12%]", widthWithoutAction: "w-[10%]", sortKey: "countyActivityName" },
  { key: "description", labelLines: ["Description"], widthWithAction: "w-[8%]", widthWithoutAction: "w-[9%]" },
  { key: "department", labelLines: ["Department"], widthWithAction: "w-[8%]", widthWithoutAction: "w-[9%]" },
  { key: "masterCodeType", labelLines: ["Master Code", "Type"], widthWithAction: "w-[8%]", widthWithoutAction: "w-[9%]" },
  { key: "masterCode", labelLines: ["Master Code"], widthWithAction: "w-[7%]", widthWithoutAction: "w-[8%]" },
  { key: "spmp", labelLines: ["SPMP"], widthWithAction: "w-[4%]", widthWithoutAction: "w-[5%]", align: "center" },
  { key: "match", labelLines: ["Match"], widthWithAction: "w-[5%]", widthWithoutAction: "w-[6%]", align: "center" },
  { key: "percent", labelLines: ["%"], widthWithAction: "w-[3%]", widthWithoutAction: "w-[4%]", align: "center" },
  { key: "active", labelLines: ["Active"], widthWithAction: "w-[4%]", widthWithoutAction: "w-[5%]", align: "center" },
  { key: "leaveCode", labelLines: ["Leave Code"], widthWithAction: "w-[7%]", widthWithoutAction: "w-[7%]" },
  { key: "apportioning", labelLines: ["Apportioning"], widthWithAction: "w-[7%]", widthWithoutAction: "w-[8%]" },
  { key: "multipleJobPools", labelLines: ["Multiple Job", "Pools"], widthWithAction: "w-[9%]", widthWithoutAction: "w-[10%]" },
]

const COUNTY_ACTIVITY_ACTION_COLUMN: CountyActivityTableColumnConfig = {
  key: "action",
  labelLines: ["Action"],
  widthWithAction: "w-[5%]",
  widthWithoutAction: "w-[5%]",
  align: "center",
}

function renderCountyActivityHeaderLabel(labelLines: readonly string[]) {
  if (labelLines.length === 1) {
    return <span className="whitespace-nowrap">{labelLines[0]}</span>
  }

  return labelLines.map((line, idx) => (
    <span key={`${line}-${idx}`}>
      {idx > 0 && <br />}
      {line}
    </span>
  ))
}

function getCountyActivityCodeRowDepartmentLabel(row: CountyActivityCodeRow): string {
  const dept = row.department?.trim() ?? ""
  return dept.length > 0 ? dept : "—"
}

function mapCountyActivityRowToFormValues(row: CountyActivityCodeRow): CountyActivityAddFormValues {
  return {
    copyCode: false,
    countyActivityCode: row.countyActivityCode ?? "",
    countyActivityName: row.countyActivityName ?? "",
    description: row.description ?? "",
    masterCodeType: row.masterCodeType ?? "",
    masterCode: row.masterCode ?? 0,
    match: row.match ?? "",
    percentage: row.percentage ?? 0,
    active: row.active ?? false,
    leaveCode: row.leaveCode ?? false,
    docRequired: row.docRequired ?? false,
    multipleJobPools: row.multipleJobPools ?? false,
    department: row.department ?? "",
    apportioning: row.apportioning ?? false,
  }
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

interface CountyActivitySubRowsWrapperProps {
  parentId: number
  isExpanded: boolean
  canUpdateCountyActivity: boolean
  setRowToEdit: (row: CountyActivityCodeRow) => void
  setEditOpen: (open: boolean) => void
  colSpan: number
}

function CountyActivitySubRowsWrapper({
  parentId,
  isExpanded,
  canUpdateCountyActivity,
  setRowToEdit,
  setEditOpen,
  colSpan,
}: CountyActivitySubRowsWrapperProps) {
  const { data: children, isLoading } = useGetNestedActivities(parentId, isExpanded)

  if (!isExpanded) return null

  if (isLoading) {
    return (
      <TableRow className="border-b border-[#E5E7EB] bg-[#F6F5FF]/50">
        <TableCell colSpan={colSpan} className="py-3 text-center align-middle">
          <div className="flex items-center justify-center gap-2 text-sm text-[#6C5DD3]">
            <Spinner className="h-4.5 w-4.5 animate-spin" />
            <span>Loading nested activities...</span>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  if (!children || children.length === 0) {
    return (
      <TableRow className="border-b border-[#E5E7EB] bg-[#F6F5FF]/50">
        <TableCell colSpan={colSpan} className="py-3 text-center align-middle text-sm text-muted-foreground">
          No sub activities found.
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {children.map((child) => (
        <TableRow
          key={child.id}
          className="ieba-data-row border-b border-[#E5E7EB] bg-[#F6F5FF]"
        >
          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0] whitespace-normal break-all">
            <span className="ml-7">{child.countyActivityCode}</span>
          </TableCell>
          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] leading-[1.4] whitespace-normal break-words font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
            {child.countyActivityName}
          </TableCell>
          <CountyActivityDescriptionTableCell description={child.description} />
          <TableCell className="min-w-0 border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] leading-[1.4] whitespace-normal break-words font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
            <CountyActivityDepartmentStackCell
              label={""}
            />
          </TableCell>
          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
            {""}
          </TableCell>
          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
            {""}
          </TableCell>
          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center text-[13px] text-[#C4C4C4]">
            <img
              src={statusCrossImg}
              alt="No"
              className="mx-auto h-4 w-4 object-contain"
            />
          </TableCell>
          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center text-[13px] text-[#C4C4C4]">
            <img
              src={statusCrossImg}
              alt="No"
              className="mx-auto h-4 w-4 object-contain"
            />
          </TableCell>
          <TableCell className="border-r border-[#E5E7EB] px-[8px] py-[5px] align-middle text-center text-[13px] text-[#C4C4C4]">
            <img
              src={statusCrossImg}
              alt="No"
              className="mx-auto h-4 w-4 object-contain"
            />
          </TableCell>
          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center">
            {child.active ? (
              <img
                src={statusCheckImg}
                alt="active"
                className="mx-auto h-4 w-4 object-contain"
              />
            ) : (
              <img
                src={statusCrossImg}
                alt="inactive"
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
            <span>--</span>
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
      ))}
    </>
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
  const queryClient = useQueryClient()
  const { canAdd, canUpdate, isSuperAdmin, user } = usePermissions()
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


  const [showHistory, setShowHistory] = useState(false)
  const [historyActivityCode, setHistoryActivityCode] = useState("")
  const [historyActivityName, setHistoryActivityName] = useState("")

  // Apportioning confirmation dialog state
  const [apportioningConfirmOpen, setApportioningConfirmOpen] = useState(false)
  const [apportioningDeptNames, setApportioningDeptNames] = useState<string[]>([])
  const [nonApportioningDeptNames, setNonApportioningDeptNames] = useState<string[]>([])
  const [pendingSaveCallback, setPendingSaveCallback] = useState<(() => void) | null>(null)

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

  const [editTypeDropdownOpened, setEditTypeDropdownOpened] = useState(false)
  const [editCodeDropdownOpened, setEditCodeDropdownOpened] = useState(false)

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

  const masterCatalogQuery = useGetMasterActivityCatalog(
    addOpen || (editOpen && editTypeDropdownOpened)
  )

  const departmentsQuery = useGetDepartmentsAll(
    { status: "active" },
    { enabled: addOpen }
  )
  const departments = departmentsQuery.data ?? []

  const assignedDepartmentIds = useMemo<number[] | undefined>(() => {
    if (isSuperAdmin) return undefined
    const ids = new Set<number>()
    user?.departmentRoles?.forEach((dr) => {
      if (dr.departmentId) ids.add(dr.departmentId)
    })
    return [...ids].sort((a, b) => a - b)
  }, [isSuperAdmin, user])

  const subPickerQuery = useGetCountyActivityActivePrimarySubPicker(
    assignedDepartmentIds,
    addOpen,
  )
  const subCountyParentPickerRows = subPickerQuery.data ?? []

  const editActivityId = editOpen && rowToEdit ? rowToEdit.id : null
  const editDetailQuery = useGetCountyActivityForEdit(editActivityId, editOpen)

  const [editSelectedPrimaryId, setEditSelectedPrimaryId] = useState<string | null>(null)
  const editPrimaryDetailQuery = useGetCountyActivityForEdit(
    editSelectedPrimaryId,
    false,
  )

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


  const resolvedEditMasterCodeId = useMemo(() => {
    if (!editOpen || !rowToEdit || rowToEdit.rowType !== CountyActivityGridRowType.PRIMARY) {
      return 0
    }

    if (masterCatalogQuery.isPending) {
      return null
    }

    if (!masterCatalogQuery.isSuccess) {
      return 0
    }

    const typeToFilter = editSyncedMasterCodeType.trim().toLowerCase()
    const items = (masterCatalogQuery.data ?? []).filter(
      (item) => String(item.type ?? "").trim().toLowerCase() === typeToFilter
    )
    const rawCode = rowToEdit.catalogActivityCode.trim()
    if (!rawCode || items.length === 0) return 0

    // Loose match: try exact first, then try numeric-value match to handle leading zeros (e.g. "00071" vs "71")
    const searchCode = rawCode.toLowerCase()
    let hit = items.find((m) => (m.code ?? "").trim().toLowerCase() === searchCode)

    if (!hit) {
      const numericSearch = Number.parseInt(searchCode, 10)
      if (!Number.isNaN(numericSearch)) {
        hit = items.find((m) => {
          const mCode = (m.code ?? "").trim()
          return Number.parseInt(mCode, 10) === numericSearch
        })
      }
    }

    return hit ? Number(hit.id) : 0
  }, [
    editOpen,
    rowToEdit?.rowType,
    rowToEdit?.catalogActivityCode,
    editSyncedMasterCodeType,
    masterCatalogQuery.isPending,
    masterCatalogQuery.isSuccess,
    masterCatalogQuery.data,
  ])

  const editFormValuesFromServer = useMemo((): CountyActivityAddFormValues | undefined => {
    if (!editOpen || !rowToEdit) return undefined

    const isDetailReady = editDetailQuery.isSuccess && editDetailQuery.data && Number(editDetailQuery.data.activity.id) === Number(rowToEdit.id)

    // Fallback to existing row data while waiting for full detail/hydration
    if (!isDetailReady || resolvedEditMasterCodeId === null) {
      return mapCountyActivityRowToFormValues(rowToEdit)
    }

    const { activity, departmentNames: editDeptNames } = editDetailQuery.data

    const parent =
      rowToEdit.rowType === CountyActivityGridRowType.SUB && rowToEdit.parentId
        ? primaryRows.find((r) => r.id === rowToEdit.parentId) ?? null
        : null

    if (rowToEdit.rowType === CountyActivityGridRowType.PRIMARY) {
      return {
        copyCode: false,
        countyActivityCode: activity.code ?? "",
        countyActivityName: activity.name ?? "",
        description: stripHtmlTags((activity.description ?? "").trim()),
        masterCodeType: activity.activityCodeType ?? "",
        masterCode: resolvedEditMasterCodeId ?? 0,
        match: rowToEdit.match ?? "",
        percentage: rowToEdit.percentage ?? 0,
        active: activity.status === ActivityStatusEnum.ACTIVE,
        leaveCode: activity.leavecode || false,
        docRequired: activity.docrequired || false,
        multipleJobPools: activity.isActivityAssignableToMultipleJobPools || false,
        department: editDeptNames.join(", ") ?? "",
        apportioning: activity.apportioning || false,
      }
    }

    return {
      copyCode: false,
      countyActivityCode: activity.code ?? "",
      countyActivityName: activity.name ?? "",
      description: stripHtmlTags((activity.description ?? "").trim()),
      masterCodeType: parent?.masterCodeType ?? rowToEdit.masterCodeType ?? "",
      masterCode: 0,
      match: rowToEdit.match ?? "",
      percentage: rowToEdit.percentage ?? 0,
      active: activity.status === ActivityStatusEnum.ACTIVE,
      leaveCode: activity.leavecode || false,
      docRequired: activity.docrequired || false,
      multipleJobPools: activity.isActivityAssignableToMultipleJobPools || false,
      department:
        (editDeptNames.length > 0 ? editDeptNames.join(", ") : rowToEdit.department) ?? "",
      apportioning: activity.apportioning || false,
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
    values: editFormValuesFromServer,
    resetOptions: {
      keepDirtyValues: true,
    },
  })

  // const editMasterCodeTypeWatched = editForm.watch("masterCodeType")

  // Code Type dropdown: derived from the all-activity-codes catalog (replaces old /master-codes call)
  const masterCodeTypeOptions = useMemo(() => {
    const data = masterCatalogQuery.data ?? []
    const types = new Set<string>()
    for (const item of data) {
      const t = String(item.type ?? "").trim()
      if (t) types.add(t)
    }
    return [...types].sort((a, b) => a.localeCompare(b))
  }, [masterCatalogQuery.data])

  // Code dropdown (Add modal): per-type call fires when user selects a Code Type
  const addMasterCodesQuery = useGetCountyActivityMasterCodes(
    addMasterCodeType,
    addOpen && addTab === CountyActivityGridRowType.PRIMARY && addMasterCodeType.trim().length > 0,
  )

  const addMasterCodeOptions = useMemo(
    () =>
      (addMasterCodesQuery.data?.items ?? [])
        .map((item) => ({
          label: item.code ? `${item.code} * ${item.name}` : item.name,
          value: Number(item.id),
          code: String(item.code ?? "").trim(),
        }))
        .filter((o) => o.code.length > 0)
        .sort((a, b) =>
          a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: "base" }),
        ),
    [addMasterCodesQuery.data?.items],
  )

  // Code dropdown (Edit modal): per-type call fires when user selects or modal loads a Code Type
  const editMasterCodesQueryType =
    editSyncedMasterCodeType.trim() || rowToEdit?.masterCodeType?.trim() || ""

  const editMasterCodesQuery = useGetCountyActivityMasterCodes(
    editMasterCodesQueryType,
    editOpen && editCodeDropdownOpened && editMasterCodesQueryType.trim().length > 0,
  )

  const editMasterCodeOptions = useMemo(() => {
    const loadedOptions = (editMasterCodesQuery.data?.items ?? [])
      .map((item) => ({
        label: item.code ? `${item.code} * ${item.name}` : item.name,
        value: Number(item.id),
        code: String(item.code ?? "").trim(),
      }))
      .filter((o) => o.code.length > 0)
      .sort((a, b) =>
        a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: "base" }),
      )

    const currentCode = editDetailQuery.data?.activity?.activityCode || rowToEdit?.catalogActivityCode
    if (currentCode) {
      const trimmedCode = currentCode.trim()
      const hasOption = loadedOptions.some(o => o.code.toLowerCase() === trimmedCode.toLowerCase())
      if (!hasOption) {
        const dummyValue = (resolvedEditMasterCodeId && resolvedEditMasterCodeId > 0)
          ? resolvedEditMasterCodeId
          : (resolvedEditMasterCodeId === 0 ? 0 : (rowToEdit?.masterCode || 0))
        const dummyLabel = `${trimmedCode} * ${editDetailQuery.data?.activity?.name || rowToEdit?.countyActivityName || ""}`
        loadedOptions.unshift({
          label: dummyLabel,
          value: dummyValue,
          code: trimmedCode,
        })
      }
    }

    return loadedOptions
  }, [
    editMasterCodesQuery.data?.items,
    editDetailQuery.data?.activity,
    rowToEdit,
    resolvedEditMasterCodeId,
  ])

  const userDepartmentsQuery = useGetDepartments(
    {
      status: "active",
      page: 1,
      limit: 100,
      userId: user?.id,
    },
    { enabled: !isSuperAdmin && !!user?.id && addOpen }
  )

  const departmentNames = useMemo(() => {
    if (editOpen && editDetailQuery.data?.activity?.activityDepartments) {
      const actDepts = editDetailQuery.data.activity.activityDepartments
      const assigned = Array.isArray(actDepts) ? actDepts : (actDepts.assigned ?? [])
      const unassigned = Array.isArray(actDepts) ? [] : (actDepts.unassigned ?? [])
      const allDepts = [...assigned, ...unassigned]
      const names = allDepts
        .map((d: any) => d.departmentName?.trim() || d.department?.name?.trim())
        .filter(Boolean) as string[]
      names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
      return [...new Set(names)]
    }

    if (isSuperAdmin) {
      return departments
        .map((d) => d.name.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    }

    const userDepts = userDepartmentsQuery.data?.items ?? []
    const userDeptNames = new Set(
      userDepts.map((d) => d.name.trim().toLowerCase())
    )

    return departments
      .filter((d) => userDeptNames.has(d.name.trim().toLowerCase()))
      .map((d) => d.name.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  }, [departments, isSuperAdmin, userDepartmentsQuery.data?.items, editOpen, editDetailQuery.data])

  const departmentIdByName = useMemo(() => {
    const map: Record<string, number> = {}
    if (editOpen && editDetailQuery.data?.activity?.activityDepartments) {
      const actDepts = editDetailQuery.data.activity.activityDepartments
      const assigned = Array.isArray(actDepts) ? actDepts : (actDepts.assigned ?? [])
      const unassigned = Array.isArray(actDepts) ? [] : (actDepts.unassigned ?? [])
      const allDepts = [...assigned, ...unassigned]

      for (const d of allDepts) {
        const id = Number(d.departmentId)
        const name = (d.departmentName || d.department?.name || "").trim()
        if (!Number.isNaN(id) && name) map[name] = id
      }
      return map
    }

    for (const d of departments) {
      const id = Number(d.id)
      const name = d.name.trim()
      if (!Number.isNaN(id) && name) map[name] = id
    }
    return map
  }, [departments, editOpen, editDetailQuery.data])

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
    primaryRows.find((r) => r.id === id)



  const doCreateCountyActivity = (
    tab: CountyActivityGridRowType,
    values: CountyActivityAddFormValues,
    departmentLinks: { id: number; apportioning?: boolean }[],
    masterCatalog: { code: string; type: string } | undefined,
  ) => {
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
            setCurrentPrimaryId(null)
            setCurrentPrimaryDefaults(null)
          } else {
            if (currentPrimaryId) {
              setExpandedRowIds((prev) => ({ ...prev, [currentPrimaryId]: true }))
            }
            addForm.reset(countyActivityAddDefaultValues)
            setCurrentPrimaryId(null)
            setCurrentPrimaryDefaults(null)
          }

          setAddFormMountKey((k) => k + 1)
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

  const submitCreateCountyActivityFromAddModal = async (
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

    // If apportioning is checked, verify department data — fetch all departments once and filter locally
    if (values.apportioning && tab === CountyActivityGridRowType.PRIMARY && departmentLinks.length > 0) {
      try {
        const assignedIds = new Set(departmentLinks.map(link => Number(link.id)))
        const allDepts = await getDepartmentsAll({ status: "active" })
        const freshDepts = allDepts.filter(d => assignedIds.has(Number(d.id)))

        const apportioningNames = freshDepts
          .filter(d => d.settings?.apportioning === true)
          .map(d => d.name.trim())

        const nonApportioningNames = freshDepts
          .filter(d => d.settings?.apportioning !== true)
          .map(d => d.name.trim())

        // Build enriched links with per-dept apportioning flag
        const enrichedLinks = freshDepts.map(d => ({
          id: Number(d.id),
          apportioning: d.settings?.apportioning === true,
        }))

        // ONLY show popup if there's a mismatch (some departments don't have apportioning enabled)
        if (apportioningNames.length < assignedNames.length) {
          setApportioningDeptNames(apportioningNames)
          setNonApportioningDeptNames(nonApportioningNames)
          setPendingSaveCallback(() => () => {
            doCreateCountyActivity(tab, values, enrichedLinks, masterCatalog)
          })
          setApportioningConfirmOpen(true)
          return
        }

        // All departments support apportioning — save with enriched links
        doCreateCountyActivity(tab, values, enrichedLinks, masterCatalog)
        return
      } catch (error) {
        console.error("Failed to verify department apportioning status:", error)
        // Fallback: proceed with regular save if API check fails
      }
    }

    doCreateCountyActivity(tab, values, departmentLinks, masterCatalog)
  }

  const doUpdateCountyActivity = (
    editingRow: CountyActivityCodeRow,
    values: CountyActivityAddFormValues,
    masterCatalog: { code: string; type: string } | undefined,
    editDepartmentLinks: { id: number; apportioning?: boolean }[],
  ) => {
    const isPrimary = editingRow.rowType === CountyActivityGridRowType.PRIMARY
    const wasActive = editingRow.active
    const isBecomingActive = values.active

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
        onSuccess: async () => {
          if (isPrimary && wasActive !== isBecomingActive) {
            const children = subRowsByParentId[editingRow.id] ?? []
            const storageKey = `active_subs_before_inactive_${editingRow.id}`

            if (!isBecomingActive) {
              const activeSubIds: string[] = []
              for (const child of children) {
                if (child.active) {
                  activeSubIds.push(child.id)
                  const childValues = mapCountyActivityRowToFormValues(child)
                  childValues.active = false
                  try {
                    await apiPutCountyActivity({
                      id: child.id,
                      values: childValues,
                      rowType: child.rowType,
                    })
                  } catch (err) {
                    console.error(`Failed to inactivate sub-activity ${child.id}:`, err)
                  }
                }
              }
              if (activeSubIds.length > 0) {
                sessionStorage.setItem(storageKey, JSON.stringify(activeSubIds))
              }
            } else {
              const stored = sessionStorage.getItem(storageKey)
              if (stored) {
                const idsToRestore = JSON.parse(stored) as string[]
                for (const childId of idsToRestore) {
                  const child = children.find((c) => c.id === childId)
                  if (child && !child.active) {
                    const childValues = mapCountyActivityRowToFormValues(child)
                    childValues.active = true
                    try {
                      await apiPutCountyActivity({
                        id: child.id,
                        values: childValues,
                        rowType: child.rowType,
                      })
                    } catch (err) {
                      console.error(`Failed to restore sub-activity ${child.id}:`, err)
                    }
                  }
                }
                sessionStorage.removeItem(storageKey)
              }
            }
            void queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.all })
          }

          toast.success(
            editingRow.rowType === CountyActivityGridRowType.PRIMARY
              ? "Primary county activity updated successfully."
              : "Secondary county activity updated successfully.",
          )
          editForm.reset()
          setEditOpen(false)
          setRowToEdit(null)
          setEditTypeDropdownOpened(false)
          setEditCodeDropdownOpened(false)
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
  }

  const submitCountyActivityEditFromEditModal = editForm.handleSubmit(async (values) => {
    if (!rowToEdit) return

    let masterCatalog: { code: string; type: string } | undefined
    if (rowToEdit.rowType === CountyActivityGridRowType.PRIMARY) {
      let catalogId = values.masterCode
      let catalog = editMasterCodeOptions.find((o) => o.value === catalogId)

      if (!catalog) {
        const currentCode = rowToEdit.catalogActivityCode.trim().toLowerCase()
        const found = editMasterCodeOptions.find((o) => o.code.toLowerCase() === currentCode)
        if (found) {
          catalogId = found.value
          catalog = found
        }
      }

      if (!catalog || !catalog.code) {
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

    if (
      editingRow.rowType === CountyActivityGridRowType.SUB &&
      values.active &&
      editingRow.parentId
    ) {
      const parent = primaryRows.find((r) => r.id === editingRow.parentId)
      if (parent && !parent.active) {
        toast.error(
          "Cannot activate: Parent County Activity is inactive. Please activate it first.",
          { icon: <OctagonXIcon className="size-5 text-red-600" /> }
        )
        return
      }
    }

    // If apportioning is checked on a primary row, verify department data — fetch all departments once and filter locally
    if (values.apportioning && editingRow.rowType === CountyActivityGridRowType.PRIMARY && editDepartmentLinks.length > 0) {
      try {
        const assignedIds = new Set(editDepartmentLinks.map(link => Number(link.id)))
        const allDepts = await getDepartmentsAll({ status: "active" })
        const freshDepts = allDepts.filter(d => assignedIds.has(Number(d.id)))

        const apportioningNames = freshDepts
          .filter(d => d.settings?.apportioning === true)
          .map(d => d.name.trim())

        const nonApportioningNames = freshDepts
          .filter(d => d.settings?.apportioning !== true)
          .map(d => d.name.trim())

        // Build enriched links with per-dept apportioning flag
        const enrichedLinks = freshDepts.map(d => ({
          id: Number(d.id),
          apportioning: d.settings?.apportioning === true,
        }))

        // ONLY show popup if there's a mismatch
        if (apportioningNames.length < editAssignedNames.length) {
          setApportioningDeptNames(apportioningNames)
          setNonApportioningDeptNames(nonApportioningNames)
          setPendingSaveCallback(() => () => {
            doUpdateCountyActivity(editingRow, values, masterCatalog, enrichedLinks)
          })
          setApportioningConfirmOpen(true)
          return
        }

        // All departments support apportioning — save with enriched links
        doUpdateCountyActivity(editingRow, values, masterCatalog, enrichedLinks)
        return
      } catch (error) {
        console.error("Failed to verify department apportioning status:", error)
      }
    }

    doUpdateCountyActivity(editingRow, values, masterCatalog, editDepartmentLinks)
  }, (errors) => {
    console.error("Edit validation errors:", errors)
    const errMsgs = Object.entries(errors)
      .map(([field, err]) => `${field}: ${err?.message || "Invalid value"}`)
      .join(", ")
    toast.error(`Please fill all required fields correctly. (Errors: ${errMsgs})`)
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
        {showHistory ? (
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <TitleCaseInput
                placeholder="Search County Activity Code"
                value={historyActivityCode}
                onChange={(e) => setHistoryActivityCode(e.target.value)}
                className="h-12 w-[220px] rounded-[10px] border border-[#D9D9D9] bg-white px-3.5 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#9CA3AF] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
              <TitleCaseInput
                placeholder="Search County Activity Name"
                value={historyActivityName}
                onChange={(e) => setHistoryActivityName(e.target.value)}
                className="h-12 w-[250px] rounded-[10px] border border-[#D9D9D9] bg-white px-3.5 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#9CA3AF] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[300px]">
            <form
              onSubmit={(event) => event.preventDefault()}
              className="relative"
            >
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
              <TitleCaseInput
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
        )}
        <div className="flex items-center gap-3 ml-auto">
          {/* History toggle button */}
          <button
            type="button"
            className={`flex h-12 items-center gap-2 rounded-[10px] px-4 text-[14px] font-normal transition-colors ${showHistory
              ? "bg-[#6C5DD3] text-white"
              : "border border-[#6C5DD3] bg-white text-[#6C5DD3] hover:bg-[#F3F0FF]"
              }`}
            onClick={() => {
              setShowHistory((prev) => {
                if (prev) {
                  filterForm.setValue("search", "")
                  onSearchChange("")
                  setHistoryActivityCode("")
                  setHistoryActivityName("")
                }
                return !prev
              })
            }}
          >
            {showHistory ? (
              <>
                <ArrowLeft className="size-4 animate-back-bounce" />
                Back to County Activity
              </>
            ) : (
              <>
                <History className="size-4" />
                History
              </>
            )}
          </button>

          {/* Inactive toggle — hidden while in history view */}
          {!showHistory && (
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
          )}
          {!showHistory && canAddCountyActivity && (
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

      {/* History — activity_definition on /users/activity-history */}
      {showHistory && (
        <div className="space-y-4">
          <CountyActivityHistoryTable
            countyActivityCode={historyActivityCode}
            countyActivityName={historyActivityName}
            historyKind={ACTIVITY_DEFINITION_HISTORY_KIND}
          />
        </div>
      )}

      <div className={`overflow-hidden rounded-[10px] border border-[#E5E7EB] ${showHistory ? "hidden" : ""}`}>
        <Table className="w-full table-fixed border-collapse">
          <colgroup>
            {COUNTY_ACTIVITY_TABLE_COLUMNS.map((column) => (
              <col
                key={column.key}
                className={
                  canUpdateCountyActivity ? column.widthWithAction : column.widthWithoutAction
                }
              />
            ))}
            {canUpdateCountyActivity && <col className={COUNTY_ACTIVITY_ACTION_COLUMN.widthWithAction} />}
          </colgroup>
          <TableHeader>
            <TableRow className="h-[52px] bg-[#6C5DD3] hover:bg-[#6C5DD3]">
              {[
                ...COUNTY_ACTIVITY_TABLE_COLUMNS,
                ...(canUpdateCountyActivity ? [COUNTY_ACTIVITY_ACTION_COLUMN] : []),
              ].map((column) => (
                <TableHead
                  key={column.key}
                  className={`h-[52px] align-middle border-r border-[#FFFFFF66] bg-[#6C5DD3] px-[8px] py-[6px] text-[13px] font-[500] leading-tight text-white font-['Roboto',sans-serif] last:border-r-0 ${
                    column.align === "center" ? "text-center" : "text-left"
                  }`}
                >
                  {column.sortKey ? (
                    <TooltipProvider>
                      <Tooltip
                        open={
                          isSortTooltipOpen && sortTooltipColumn === column.sortKey
                        }
                      >
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => {
                              setSortTooltipColumn(column.sortKey!)
                              setIsSortTooltipOpen(true)
                              toggleCountyActivityTableSortColumn(column.sortKey!)
                            }}
                            onMouseEnter={() => {
                              setSortTooltipColumn(column.sortKey!)
                              setIsSortTooltipOpen(true)
                            }}
                            onMouseLeave={() => setIsSortTooltipOpen(false)}
                            onFocus={() => {
                              setSortTooltipColumn(column.sortKey!)
                              setIsSortTooltipOpen(true)
                            }}
                            onBlur={() => setIsSortTooltipOpen(false)}
                            className="flex h-full max-w-full cursor-pointer items-center gap-2 text-left font-[400]"
                          >
                            <span className="max-w-full leading-tight font-normal">
                              {renderCountyActivityHeaderLabel(column.labelLines)}
                            </span>
                            <span className="inline-flex shrink-0 flex-col">
                              <span
                                className={`h-0 w-0 border-b-[5px] border-l-[4px] border-r-[4px] border-l-transparent border-r-transparent ${
                                  sortBy === column.sortKey && sortDirection === "asc"
                                    ? "border-b-[#1E8BFF]"
                                    : "border-b-white/60"
                                }`}
                              />
                              <span
                                className={`mt-0.5 h-0 w-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent ${
                                  sortBy === column.sortKey && sortDirection === "desc"
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
                          {getCountyActivityTableSortColumnTooltip(column.sortKey)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <div
                      className={`flex h-full items-center leading-tight font-[400] ${
                        column.align === "center" ? "justify-center" : ""
                      }`}
                    >
                      {renderCountyActivityHeaderLabel(column.labelLines)}
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-transparent text-center">
                <TableCell
                  colSpan={canUpdateCountyActivity ? 13 : 12}
                  className="h-40 p-0"
                >
                  <div className="flex h-full w-full items-center justify-center">
                    <Spinner className="text-[#6C5DD3]" />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {/* Skeletons visible for first 200ms then collapse */}
                {Array.from({ length: pagination.pageSize }, (_, rowIndex) => (
                  <TableRow
                    key={`skeleton-${rowIndex}`}
                    className="ieba-skeleton-row border-b border-[#E5E7EB]"
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
                ))}

                {/* Data rows appearing after 200ms */}
                {rows.length === 0 ? (
                  <TableRow className="ieba-data-row">
                    <TableCell
                      colSpan={canUpdateCountyActivity ? 14 : 13}
                      className="h-20 text-center text-sm text-muted-foreground"
                    >
                      No county activity codes found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRows.flatMap((row) => {
                    const isExpanded = Boolean(expandedRowIds[row.id])
                    const hasChildren = row.hasChildren

                    const countyActivityPrimaryTableRow = (
                      <TableRow key={row.id} className="ieba-data-row border-b border-[#E5E7EB]">
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0] whitespace-normal break-all">
                          <button
                            type="button"
                            className={`mr-1 inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] align-middle ${hasChildren ? "text-[#6C5DD3] hover:bg-[#6C5DD3]/10" : "opacity-0"
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
                          {row.countyActivityCode}
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] leading-[1.4] whitespace-normal break-words font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          {row.countyActivityName}
                        </TableCell>
                        <CountyActivityDescriptionTableCell description={row.description} />
                        <TableCell className="min-w-0 border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] leading-[1.4] whitespace-normal break-words font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          <CountyActivityDepartmentStackCell label={getCountyActivityCodeRowDepartmentLabel(row)} />
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          {row.masterCodeType}
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-top text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          {row.catalogActivityCode || "—"}
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
                          {row.active ? (
                            <img
                              src={statusCheckImg}
                              alt="active"
                              className="mx-auto h-4 w-4 object-contain"
                            />
                          ) : (
                            <img
                              src={statusCrossImg}
                              alt="inactive"
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
                          {row.rowType === CountyActivityGridRowType.SUB ? (
                            <span>--</span>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {row.apportioning ? (
                                    <img
                                      src={statusCheckImg}
                                      alt="apportioning"
                                      className="mx-auto h-4 w-4 object-contain cursor-default"
                                    />
                                  ) : (
                                    <img
                                      src={statusCrossImg}
                                      alt="No"
                                      className="mx-auto h-4 w-4 object-contain cursor-default"
                                    />
                                  )}
                                </TooltipTrigger>
                                {row.apportioningDepartments && row.apportioningDepartments.length > 0 && (
                                  <TooltipContent
                                    side="top"
                                    align="center"
                                    sideOffset={6}
                                    className="z-50 !inline-block max-h-[min(20rem,70vh)] max-w-[min(20rem,70vw)] overflow-y-auto rounded-[8px] border-0 bg-black px-3 py-2.5 text-left text-[12px] font-medium leading-relaxed text-white shadow-lg"
                                  >
                                    <span className="block text-center whitespace-normal break-words font-semibold mb-1">
                                      Apportioning :
                                    </span>
                                    <ul className="list-disc pl-4 space-y-1 m-0">
                                      {row.apportioningDepartments.map((dept, idx) => (
                                        <li key={idx}>
                                          {dept.name} - {dept.apportioning ? "Yes" : "No"}
                                        </li>
                                      ))}
                                    </ul>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
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

                    const countyActivitySubTableRows = (
                      <CountyActivitySubRowsWrapper
                        key={row.id + "-subs"}
                        parentId={Number(row.id)}
                        isExpanded={isExpanded}
                        canUpdateCountyActivity={canUpdateCountyActivity}
                        setRowToEdit={setRowToEdit}
                        setEditOpen={setEditOpen}
                        colSpan={canUpdateCountyActivity ? 14 : 13}
                      />
                    )

                    return [countyActivityPrimaryTableRow, countyActivitySubTableRows]
                  })
                )}
              </>
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
          className="max-h-[85vh] w-[1120px] max-w-[calc(100vw-2rem)] overflow-y-auto border-0 bg-transparent p-0 shadow-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          overlayClassName="bg-black/50"
        >
          <CountyActivityCodeAddPage
            key={addFormMountKey}
            form={addForm}
            onAddSave={submitCreateCountyActivityFromAddModal}
            subParentActivityDetail={addSubParentDetailQuery.data ?? null}
            tab={addTab}
            masterCodeTypeOptions={masterCodeTypeOptions}
            isMasterCodeTypeOptionsLoading={masterCatalogQuery.isFetching}
            masterCodeOptions={addMasterCodeOptions}
            isMasterCodeOptionsLoading={addMasterCodesQuery.isFetching}
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
            isSubmitting={createCountyActivityCode.isPending}
            isEditSourceLoading={addTab === CountyActivityGridRowType.SUB && addSubParentDetailQuery.isPending}
            apportioningDepartments={addSubParentDetailQuery.data?.apportioningDepartments}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          showClose={false}
          className="max-h-[85vh] w-[1120px] max-w-[calc(100vw-2rem)] overflow-y-auto border-0 bg-transparent p-0 shadow-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          overlayClassName="bg-black/50"
        >
          {editDetailQuery.isPending && editOpen ? (
            <div className="flex h-[500px] w-full items-center justify-center rounded-[10px] bg-white">
              <Spinner className="text-[#6C5DD3]" />
            </div>
          ) : rowToEdit ? (
            <CountyActivityCodeAddPage
              key={rowToEdit.id}
              mode={CountyActivityAddPageMode.EDIT}
              form={editForm}
              tab={
                rowToEdit.rowType === CountyActivityGridRowType.SUB
                  ? CountyActivityGridRowType.SUB
                  : CountyActivityGridRowType.PRIMARY
              }
              onTabChange={() => { }}
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
              readOnlyPrimaryPicker={false}
              masterCodeTypeOptions={masterCodeTypeOptions}
              isMasterCodeTypeOptionsLoading={masterCatalogQuery.isFetching}
              masterCodeOptions={editMasterCodeOptions}
              isMasterCodeOptionsLoading={editMasterCodesQuery.isFetching}
              isEditSourceLoading={editDetailQuery.isPending}
              departmentNames={departmentNames}
              apportioningDepartments={editDetailQuery.data?.apportioningDepartments}
              onSelectedPrimaryIdChange={(id) => {
                setEditSelectedPrimaryId(id)
                if (editPrimaryDetailQuery.data && String(editPrimaryDetailQuery.data.activity.id) === id) {
                  const { activity, departmentNames: deptNames } = editPrimaryDetailQuery.data
                  editForm.setValue("masterCodeType", activity.activityCodeType)
                  editForm.setValue("masterCode", parseMasterCodeDisplay(activity.activityCode))
                  editForm.setValue("department", deptNames.join(", "))
                } else {
                  const selected = findCountyActivityRowForSubParentPickerById(id)
                  if (selected) {
                    editForm.setValue("masterCodeType", selected.masterCodeType)
                    editForm.setValue("masterCode", selected.masterCode)
                    editForm.setValue("department", selected.department)
                  }
                }
              }}
              onEditSave={() => {
                void submitCountyActivityEditFromEditModal()
              }}
              onClose={() => {
                setEditOpen(false)
                setRowToEdit(null)
                setEditTypeDropdownOpened(false)
                setEditCodeDropdownOpened(false)
              }}
              isSubmitting={updateCountyActivityCode.isPending}
              onCodeDropdownOpenChange={(open) => {
                if (open) setEditCodeDropdownOpened(true)
              }}
              onTypeDropdownOpenChange={(open) => {
                if (open) setEditTypeDropdownOpened(true)
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Apportioning Confirmation Dialog */}
      <Dialog open={apportioningConfirmOpen} onOpenChange={setApportioningConfirmOpen}>
        <DialogContent
          showClose={false}
          className="w-[480px] max-w-[calc(100vw-2rem)] rounded-[14px] border border-[#E5E7EB] bg-white p-0 shadow-xl"
          overlayClassName="bg-black/50"
        >
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE9FF]">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4a1 1 0 011 1v3a1 1 0 11-2 0V7a1 1 0 011-1zm0 8a1 1 0 110-2 1 1 0 010 2z" fill="#6C5DD3" />
                </svg>
              </div>
              <div>
                <h3 className="text-[17px] font-semibold text-[#111827]">
                  {apportioningDeptNames.length === 0
                    ? "Apportioning Not Supported"
                    : "Apportioning Setup Conflict"}
                </h3>
                <p className="mt-1 text-[13px] text-[#6B7280] leading-relaxed">
                  {apportioningDeptNames.length === 0
                    ? "None of the assigned departments have apportioning enabled in their settings."
                    : "Some assigned departments do not support apportioning."}
                </p>
              </div>
            </div>

            {/* Scenario: Some have it, some don't */}
            {apportioningDeptNames.length > 0 && (
              <div className="space-y-4">
                <div className="rounded-[12px] border border-green-200 bg-green-50/40 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[12px] font-bold text-green-700 uppercase tracking-widest">
                      Will be saved with Apportioning
                    </p>
                  </div>
                  <ul className="grid grid-cols-1 gap-2 pl-1">
                    {apportioningDeptNames.map((name) => (
                      <li key={name} className="flex items-center gap-2 text-[14px] font-medium text-[#1F2937]">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-green-600">
                          <path d="M16.667 5l-9.167 9.167L3.333 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[12px] border border-red-200 bg-red-50/40 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <p className="text-[12px] font-bold text-red-700 uppercase tracking-widest">
                      Will NOT be saved with Apportioning
                    </p>
                  </div>
                  <ul className="grid grid-cols-1 gap-2 pl-1 mb-3">
                    {nonApportioningDeptNames.map((name) => (
                      <li key={name} className="flex items-center gap-2 text-[14px] font-medium text-[#1F2937]">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-red-500">
                          <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {name}
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-red-100 pt-2">
                    <p className="text-[11px] text-red-600 font-medium italic">
                      <strong>Note:</strong> {nonApportioningDeptNames.length === 1 ? "This department has" : "These departments have"} apportioning false.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Scenario: None have it */}
            {apportioningDeptNames.length === 0 && (
              <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-4 text-center">
                <p className="text-[14px] font-medium text-red-800">
                  No apportioning will be saved for this activity.
                </p>
              </div>
            )}

            <p className="text-[13px] text-[#6B7280] leading-relaxed">
              Do you want to proceed with saving this activity anyway?
            </p>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setApportioningConfirmOpen(false)
                  setPendingSaveCallback(null)
                }}
                className="h-[40px] rounded-[10px] bg-[#E5E7EB] px-5 text-[14px] font-normal text-[#111827] hover:bg-[#D1D5DB]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setApportioningConfirmOpen(false)
                  if (pendingSaveCallback) {
                    pendingSaveCallback()
                    setPendingSaveCallback(null)
                  }
                }}
                className="h-[40px] rounded-[10px] bg-[#6C5DD3] px-5 text-[14px] font-normal text-white hover:bg-[#5B4DC5]"
              >
                OK, Proceed
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
