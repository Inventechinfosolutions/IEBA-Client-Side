import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ChevronDown, ChevronRight, History, OctagonXIcon, PlusIcon, SearchIcon, Eye, X } from "lucide-react"

import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { guardNoChanges, getChangedFields } from "@/lib/formGuard"

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
  useGetCountyActivityForEdit,
  useGetCountyActivityMasterCodes,
  useGetMasterActivityCatalog,
  useGetCountyActivityNested,
  useGetCountyActivityActivePrimarySubPicker,
  fetchCountyActivityNestedRows,
} from "../queries/getCountyActivityCodes"
import { ACTIVITY_DEFINITION_HISTORY_KIND } from "../queries/activityHistory"
import {
  apiPutCountyActivity,
  normalizeCountyActivityApportioningFlags,
  parseMasterCodeDisplay,
} from "../api/countyActivityApi"
import { usePermissions } from "@/hooks/usePermissions"
import { useGetAllDepartments } from "@/features/department/queries/getDepartments"


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
  { key: "code", labelLines: ["County Activity", "Code"], widthWithAction: "w-[13%]", widthWithoutAction: "w-[15%]", sortKey: "countyActivityCode" },
  { key: "name", labelLines: ["County Activity", "Name"], widthWithAction: "w-[11%]", widthWithoutAction: "w-[11%]", sortKey: "countyActivityName" },
  { key: "description", labelLines: ["Description"], widthWithAction: "w-[8%]", widthWithoutAction: "w-[9%]" },
  { key: "department", labelLines: ["Department"], widthWithAction: "w-[8%]", widthWithoutAction: "w-[9%]" },
  { key: "masterCodeType", labelLines: ["Master Code", "Type"], widthWithAction: "w-[9%]", widthWithoutAction: "w-[10%]" },
  { key: "masterCode", labelLines: ["Master", "Code"], widthWithAction: "w-[9%]", widthWithoutAction: "w-[10%]" },
  { key: "spmp", labelLines: ["SPMP"], widthWithAction: "w-[4%]", widthWithoutAction: "w-[3%]", align: "center" },
  { key: "match", labelLines: ["Match"], widthWithAction: "w-[4%]", widthWithoutAction: "w-[3%]", align: "center" },
  { key: "percent", labelLines: ["%"], widthWithAction: "w-[4%]", widthWithoutAction: "w-[3%]", align: "center" },
  { key: "active", labelLines: ["Active"], widthWithAction: "w-[4%]", widthWithoutAction: "w-[3%]", align: "center" },
  { key: "leaveCode", labelLines: ["Leave", "Code"], widthWithAction: "w-[5%]", widthWithoutAction: "w-[5%]" },
  { key: "apportioning", labelLines: ["Apportioning"], widthWithAction: "w-[8%]", widthWithoutAction: "w-[10%]" },
  { key: "multipleJobPools", labelLines: ["Multiple Job", "Pools"], widthWithAction: "w-[8%]", widthWithoutAction: "w-[9%]" },
]

const COUNTY_ACTIVITY_ACTION_COLUMN: CountyActivityTableColumnConfig = {
  key: "action",
  labelLines: ["Action"],
  widthWithAction: "w-[5%]",
  widthWithoutAction: "w-[5%]",
  align: "center",
}

function renderCountyActivityHeaderLabel(labelLines: readonly string[]) {
  return (
    <span className="block whitespace-normal break-words">
      {labelLines.map((line, idx) => (
        <span key={`${line}-${idx}`} className="block">
          {line}
        </span>
      ))}
    </span>
  )
}

function getCountyActivityCodeRowDepartmentLabel(row: CountyActivityCodeRow): string {
  const dept = row.department?.trim() ?? ""
  return dept.length > 0 ? dept : "—"
}

function mapCountyActivityRowToFormValues(row: CountyActivityCodeRow): CountyActivityAddFormValues {
  return {
    copyCode: false,
    countyActivityCode: row.countyActivityCode,
    countyActivityName: row.countyActivityName,
    description: row.description,
    masterCodeType: row.masterCodeType,
    masterCode: row.masterCode,
    match: row.match,
    percentage: row.percentage,
    active: row.active,
    leaveCode: row.leaveCode,
    docRequired: row.docRequired,
    multipleJobPools: row.multipleJobPools,
    department: row.department,
    apportioning: row.apportioning,
    manualApportioning: row.apportioning,
    bhsaApplicable: row.bhsaApplicable,
    expenditureClassification: row.expenditureClassification ?? "",
    bhccCategory: row.bhccCategory ?? "",
    ageGroup: row.ageGroup ?? "",
    otherCountyExpenditureType: row.otherCountyExpenditureType ?? "",
    bhsaNotes: row.bhsaNotes ?? "",
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
    <TableCell className="min-w-0 max-w-0 border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
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

function CountyActivitySubTableRowsRenderer({
  parentId,
  canUpdateCountyActivity,
  onEditRow,
}: {
  parentId: string
  canUpdateCountyActivity: boolean
  onEditRow: (child: CountyActivityCodeRow) => void
}) {
  const query = useGetCountyActivityNested(Number(parentId), true)
  const children = query.data ?? []

  if (query.isLoading) {
    return (
      <TableRow className="ieba-data-row border-b border-[#E5E7EB] bg-[#F6F5FF]">
        <TableCell colSpan={canUpdateCountyActivity ? 14 : 13} className="text-center py-4">
          <Spinner className="text-[#6C5DD3] mx-auto" />
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
          <TableCell className="border-r border-[#E5E7EB] px-[10px] py-[5px] align-middle text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0] whitespace-nowrap">
            <div className="flex items-start gap-1">
              <div className="w-7 shrink-0" />
              <span className="flex-1 whitespace-nowrap">
                {child.countyActivityCode}
              </span>
            </div>
          </TableCell>
          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-left text-[14px] leading-[1.4] whitespace-normal break-words font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
            {child.countyActivityName}
          </TableCell>
          <CountyActivityDescriptionTableCell description={child.description} />
          <TableCell className="min-w-0 border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-left text-[14px] leading-[1.4] whitespace-normal break-words font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
            <CountyActivityDepartmentStackCell
              label={
                child.rowType === CountyActivityGridRowType.SUB
                  ? ""
                  : getCountyActivityCodeRowDepartmentLabel(child)
              }
            />
          </TableCell>
          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0] whitespace-normal break-words">
            {child.rowType === CountyActivityGridRowType.SUB
              ? ""
              : child.masterCodeType}
          </TableCell>
          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0] whitespace-normal break-all">
            {child.rowType === CountyActivityGridRowType.SUB
              ? ""
              : child.catalogActivityCode || "—"}
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
            <TableCell className="px-[14px] py-[5px] align-middle text-center">
              {child.apportioning === true && child.manualApportioning === true ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                        onClick={() => onEditRow(child)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="center"
                      sideOffset={6}
                      className="z-50 !inline-block rounded-[8px] border-0 bg-black px-3 py-2.5 text-left text-[12px] font-medium leading-relaxed text-white shadow-lg"
                    >
                      Auto-created manual activity cannot be modified
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                  onClick={() => onEditRow(child)}
                >
                  <img
                    src={editIconImg}
                    alt="Edit"
                    className="h-4 w-4 object-contain"
                  />
                </Button>
              )}
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  )
}

/** Mobile card renderer for secondary (sub) county activity rows */
function CountyActivitySubCardsRenderer({
  parentId,
  canUpdateCountyActivity,
  onEditRow,
}: {
  parentId: string
  canUpdateCountyActivity: boolean
  onEditRow: (child: CountyActivityCodeRow) => void
}) {
  const query = useGetCountyActivityNested(Number(parentId), true)
  const children = query.data ?? []

  if (query.isLoading) {
    return (
      <div className="col-span-full rounded-[8px] border border-[#E5E7EB] bg-[#F6F5FF] p-4 text-center">
        <Spinner className="text-[#6C5DD3] mx-auto" />
      </div>
    )
  }

  if (children.length === 0) return null

  return (
    <>
      {children.map((child) => (
        <div
          key={`sub-card-${child.id}`}
          className="rounded-[8px] border border-[#C4B5FD]/60 border-l-4 border-l-[#8B7FD4] bg-[#F6F5FF] shadow-sm overflow-hidden flex flex-col"
        >
          {/* Sub-card header — lighter purple */}
          <div className="flex items-center gap-2 bg-[#8B7FD4] px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-white/80 shrink-0">Sub:</span>
            <span className="text-[12px] font-semibold text-white truncate">{child.countyActivityCode}</span>
          </div>

          {/* Sub-card body */}
          <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
            <div className="space-y-1.5 text-[12px]">
              {/* Name */}
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-[10px] uppercase tracking-wider text-gray-700 font-bold shrink-0">Name:</span>
                <span className="text-gray-600 font-normal break-words min-w-0">{child.countyActivityName || "—"}</span>
              </div>
              {/* Description */}
              {child.description && (
                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-gray-700 font-bold shrink-0">Desc:</span>
                  <span className="text-gray-500 font-normal text-[11px] break-words min-w-0 line-clamp-2">{child.description}</span>
                </div>
              )}
              {/* Flags */}
              <div className="flex flex-wrap gap-2 pt-0.5">
                {[
                  { label: "Active", val: child.active },
                  { label: "Leave", val: child.leaveCode },
                  { label: "Multi-Pool", val: child.multipleJobPools },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-gray-700 font-bold">{label}:</span>
                    <img
                      src={val ? statusCheckImg : statusCrossImg}
                      alt={val ? "Yes" : "No"}
                      className="h-3 w-3 object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Edit action */}
            {canUpdateCountyActivity && (
              <div className="flex justify-end pt-2 border-t border-[#C4B5FD]/40 mt-1">
                {child.apportioning === true && child.manualApportioning === true ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#e2e8f0] bg-white px-2.5 text-[11px] font-medium text-gray-400 cursor-not-allowed opacity-70"
                  >
                    <Eye className="h-3 w-3" />
                    <span>View Only</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onEditRow(child)}
                    className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#e2e8f0] bg-white px-2.5 text-[11px] font-medium text-[#6C5DD3] hover:bg-[#F3F0FF] transition-colors"
                  >
                    <img src={editIconImg} alt="Edit" className="h-3 w-3 object-contain" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  )
}


export function CountyActivityCodeTable({
  rows,
  primaryRows,
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

  const [addOpen, setAddOpen] = useState(false)
  const [hasCreatedNew, setHasCreatedNew] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [rowToEdit, setRowToEdit] = useState<CountyActivityCodeRow | null>(null)
  const [editMasterCodesDropdownOpened, setEditMasterCodesDropdownOpened] = useState(false)
  const [codeTypeDropdownOpened, setCodeTypeDropdownOpened] = useState(false)
  const [primaryPickerOpened, setPrimaryPickerOpened] = useState(false)
  const [addTab, setAddTab] = useState<CountyActivityGridRowType>(
    CountyActivityGridRowType.PRIMARY,
  )
  /** Remount add modal so Code Type / Code Selects reflect `reset()` after save or reopen. */
  const [addFormMountKey, setAddFormMountKey] = useState(0)
  const [currentPrimaryId, setCurrentPrimaryId] = useState<string | null>(null)
  const [currentPrimaryDefaults, setCurrentPrimaryDefaults] =
    useState<CountyActivitySubFlowPrimaryDefaults | null>(null)

  // Convert Set to sorted array for stable query key + API call
  const assignedDepartmentIds = useMemo<number[] | undefined>(() => {
    const ids = new Set<number>()
    user?.departmentRoles?.forEach(dr => {
      if (dr.departmentId) ids.add(dr.departmentId)
    })
    if (isSuperAdmin) return undefined
    return [...ids].sort((a, b) => a - b)
  }, [isSuperAdmin, user])

  // Fetch all departments lazily — only fires when Add modal is open
  const allDepartmentsQuery = useGetAllDepartments(
    { status: "active" },
    { enabled: addOpen || editOpen },
  )
  const departments = allDepartmentsQuery.data?.items ?? []

  const editActivityId = editOpen && rowToEdit ? rowToEdit.id : null
  const editDetailQuery = useGetCountyActivityForEdit(editActivityId, editOpen)

  const subPickerQuery = useGetCountyActivityActivePrimarySubPicker(
    assignedDepartmentIds,
    // Only fire the API when the user has actually clicked the Primary Activity Code dropdown
    primaryPickerOpened &&
    (
      (addOpen && addTab === CountyActivityGridRowType.SUB) ||
      (editOpen && rowToEdit?.rowType === CountyActivityGridRowType.SUB)
    ),
  )

  const subCountyParentPickerRows = useMemo(() => {
    const raw = subPickerQuery.data ?? []
    const nameById = new Map<number, string>()
    for (const d of departments) {
      const id = Number(d.id)
      const name = d.name.trim()
      if (!Number.isNaN(id) && name) nameById.set(id, name)
    }
    return raw.map((row) => {
      const ids = row.linkedDepartmentIds ?? []
      const names = ids
        .map((id) => nameById.get(id))
        .filter((n): n is string => Boolean(n?.trim()))
      names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
      const department = names.length > 0 ? names.join(", ") : row.department
      return { ...row, department }
    })
  }, [subPickerQuery.data, departments])

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

  const masterCatalogQuery = useGetMasterActivityCatalog((addOpen || editOpen) && codeTypeDropdownOpened)

  const [editSelectedPrimaryId, setEditSelectedPrimaryId] = useState<string | null>(null)
  const editPrimaryDetailQuery = useGetCountyActivityForEdit(
    editSelectedPrimaryId,
    editOpen &&
    rowToEdit?.rowType === CountyActivityGridRowType.SUB &&
    Boolean(editSelectedPrimaryId?.trim()),
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




  const editFormValuesFromServer = useMemo((): CountyActivityAddFormValues => {
    if (!editOpen || !rowToEdit) return countyActivityAddDefaultValues

    const isDetailReady = editDetailQuery.isSuccess && editDetailQuery.data && Number(editDetailQuery.data.activity.id) === Number(rowToEdit.id)

    // Fallback to existing row data while waiting for full detail/hydration
    if (!isDetailReady) {
      return mapCountyActivityRowToFormValues(rowToEdit)
    }

    const { activity, departmentNames: editDeptNames } = editDetailQuery.data
    const { apportioning, manualApportioning } = normalizeCountyActivityApportioningFlags(
      activity.apportioning,
    )

    const parent =
      rowToEdit.rowType === CountyActivityGridRowType.SUB && rowToEdit.parentId
        ? primaryRows.find((r) => r.id === rowToEdit.parentId) ?? null
        : null

    if (rowToEdit.rowType === CountyActivityGridRowType.PRIMARY) {
      return {
        copyCode: false,
        countyActivityCode: activity.code,
        countyActivityName: activity.name,
        description: stripHtmlTags((activity.description ?? "").trim()),
        masterCodeType: activity.activityCodeType,
        masterCode: activity.activityCodeId ?? 0,
        match: rowToEdit.match,
        percentage: rowToEdit.percentage,
        active: activity.status === ActivityStatusEnum.ACTIVE,
        leaveCode: activity.leavecode,
        docRequired: activity.docrequired,
        multipleJobPools: activity.isActivityAssignableToMultipleJobPools,
        department: editDeptNames.join(", "),
        apportioning,
        manualApportioning,
        bhsaApplicable: activity.bhsaApplicable ?? false,
        expenditureClassification: activity.expenditureClassification ?? "",
        bhccCategory: activity.bhccCategory ?? "",
        ageGroup: activity.ageGroup ?? "",
        otherCountyExpenditureType: activity.otherCountyExpenditureType ?? "",
        bhsaNotes: activity.bhsaNotes ?? "",
      }
    }

    return {
      copyCode: false,
      countyActivityCode: activity.code,
      countyActivityName: activity.name,
      description: stripHtmlTags((activity.description ?? "").trim()),
      masterCodeType: parent?.masterCodeType ?? rowToEdit.masterCodeType,
      masterCode: 0,
      match: rowToEdit.match,
      percentage: rowToEdit.percentage,
      active: activity.status === ActivityStatusEnum.ACTIVE,
      leaveCode: activity.leavecode,
      docRequired: activity.docrequired,
      multipleJobPools: activity.isActivityAssignableToMultipleJobPools,
      department:
        editDeptNames.length > 0
          ? editDeptNames.join(", ")
          : rowToEdit.department,
      apportioning,
      manualApportioning,
      bhsaApplicable: activity.bhsaApplicable ?? false,
      expenditureClassification: activity.expenditureClassification ?? "",
      bhccCategory: activity.bhccCategory ?? "",
      ageGroup: activity.ageGroup ?? "",
      otherCountyExpenditureType: activity.otherCountyExpenditureType ?? "",
      bhsaNotes: activity.bhsaNotes ?? "",
    }
  }, [
    editOpen,
    rowToEdit,
    editDetailQuery.isSuccess,
    editDetailQuery.data,
    primaryRows,
  ])

  const editForm = useForm<CountyActivityAddFormValues>({
    resolver: zodResolver(countyActivityAddFormSchema),
    defaultValues: countyActivityAddDefaultValues,
    values: editFormValuesFromServer,
  })

  const watchMasterCode = editForm.watch("masterCode")
  const editWatchMasterCodeType = editForm.watch("masterCodeType")

  const editMasterCodesQueryType =
    editWatchMasterCodeType?.trim() ||
    editSyncedMasterCodeType.trim() ||
    rowToEdit?.masterCodeType?.trim() ||
    ""

  const editMasterCodesQuery = useGetCountyActivityMasterCodes(
    editMasterCodesQueryType,
    editOpen &&
    rowToEdit != null &&
    rowToEdit.rowType !== CountyActivityGridRowType.SUB &&
    editMasterCodesQueryType.trim().length > 0 &&
    (editMasterCodesDropdownOpened || editMasterCodesQueryType !== rowToEdit.masterCodeType),
  )

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



  const editMasterCodeOptions = useMemo(
    () => {
      const base = (editMasterCodesQuery.data?.items ?? [])
        .map((item) => ({
          label: item.code ? `${item.code} * ${item.name}` : item.name,
          value: Number(item.id),
          code: String(item.code ?? "").trim(),
        }))
        .filter((o) => o.code.length > 0)

      const selectedId = watchMasterCode || editDetailQuery.data?.activity.activityCodeId
      if (
        selectedId &&
        rowToEdit?.rowType === CountyActivityGridRowType.PRIMARY &&
        !base.some((o) => o.value === selectedId)
      ) {
        const name = editDetailQuery.data?.activity.activityCodeName ?? rowToEdit.countyActivityName
        const code = editDetailQuery.data?.activity.activityCode ?? rowToEdit.catalogActivityCode
        base.push({
          label: code ? `${code} * ${name}` : name,
          value: selectedId,
          code: code,
        })
      }

      return base.sort((a, b) =>
        a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: "base" }),
      )
    },
    [editMasterCodesQuery.data?.items, rowToEdit, editDetailQuery.data?.activity, watchMasterCode],
  )

  const departmentNames = useMemo(() => {
    if (isSuperAdmin) {
      return departments
        .map((d) => d.name.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    }

    const assignedIds = new Set<number>()
    user?.departmentRoles?.forEach((dr) => {
      if (dr.departmentId) assignedIds.add(dr.departmentId)
    })

    return departments
      .filter((d) => assignedIds.has(Number(d.id)))
      .map((d) => d.name.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  }, [departments, isSuperAdmin, user?.departmentRoles])

  const editModalDepartmentNames = useMemo(() => {
    if (!editDetailQuery.data?.activity) return []
    const activity = editDetailQuery.data.activity
    const assigned = activity.assignedDepartments ?? []
    const unassigned = activity.unassignedDepartments ?? []

    if (assigned.length === 0 && unassigned.length === 0) {
      return []
    }

    const allDepts = [...assigned, ...unassigned]
    const names = allDepts
      .map((d) => String(d.name ?? "").trim())
      .filter(Boolean)

    return [...new Set(names)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  }, [editDetailQuery.data?.activity])

  const departmentIdByName = useMemo(() => {
    // In Add mode: use global departments list
    const map: Record<string, number> = {}
    for (const d of departments) {
      const id = Number(d.id)
      const name = d.name.trim()
      if (!Number.isNaN(id) && name) map[name] = id
    }

    // In Edit mode: ONLY use assignedDepartments + unassignedDepartments from get-by-id response.
    // The `departments` field is a legacy join field and may be incomplete; do NOT use it here.
    if (editDetailQuery.data?.activity) {
      const act = editDetailQuery.data.activity
      const depts = [
        ...(act.assignedDepartments ?? []),
        ...(act.unassignedDepartments ?? []),
      ]
      for (const d of depts) {
        const id = Number(d.id)
        const name = d.name?.trim()
        if (!Number.isNaN(id) && name) map[name] = id
      }
    }

    if (editPrimaryDetailQuery.data?.activity) {
      const act = editPrimaryDetailQuery.data.activity
      const depts = [
        ...(act.assignedDepartments ?? []),
        ...(act.unassignedDepartments ?? []),
      ]
      for (const d of depts) {
        const id = Number(d.id)
        const name = d.name?.trim()
        if (!Number.isNaN(id) && name) map[name] = id
      }
    }

    return map
  }, [departments, editDetailQuery.data?.activity, editPrimaryDetailQuery.data?.activity])

  const formatCountyActivityPrimaryPickerOptionLabel = (row: CountyActivityCodeRow): string => {
    return row.countyActivityName
      ? `${row.countyActivityCode} - ${row.countyActivityName}`
      : row.countyActivityCode
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
        const act = editDetailQuery.data?.activity
        const serverParentId = act?.parent?.id
        const parentCode = act?.parent?.code

        if (serverParentId === Number(pid) && parentCode) {
          const parentName = act?.parent?.name
          const label = parentName ? `${parentCode} - ${parentName}` : parentCode
          return [
            { label, value: pid },
            ...base,
          ]
        }

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
  }, [addModalPrimaryActivityOptions, rowToEdit, primaryRows, editDetailQuery.data])

  const findCountyActivityRowForSubParentPickerById = (
    id: string,
  ): CountyActivityCodeRow | undefined =>
    subCountyParentPickerRows.find((r) => r.id === id) ??
    primaryRows.find((r) => r.id === id)



  const doCreateCountyActivity = (
    tab: CountyActivityGridRowType,
    values: CountyActivityAddFormValues,
    departmentLinks: { id: number; apportioning?: boolean; manualApportioning?: boolean }[],
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

          // Mark that at least one county activity was created in this session.
          // The table paged list will be refreshed only when the Add modal is closed.
          setHasCreatedNew(true)

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
          setCodeTypeDropdownOpened(false)
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

    doCreateCountyActivity(tab, values, departmentLinks, masterCatalog)
  }

  const doUpdateCountyActivity = (
    editingRow: CountyActivityCodeRow,
    values: Partial<CountyActivityAddFormValues>,
    masterCatalog: { code: string; type: string } | undefined,
    editDepartmentLinks: { id: number; apportioning?: boolean; manualApportioning?: boolean }[] | undefined,
  ) => {
    const isPrimary = editingRow.rowType === CountyActivityGridRowType.PRIMARY
    const wasActive = editingRow.active
    const isBecomingActive = values.active !== undefined ? values.active : wasActive

    updateCountyActivityCode.mutate(
      {
        id: editingRow.id,
        values,
        originalValues: editFormValuesFromServer,
        rowType: editingRow.rowType,
        parentId: editingRow.parentId,
        masterCatalog,
        departmentLinks:
          editingRow.rowType === CountyActivityGridRowType.PRIMARY
            ? editDepartmentLinks
            : undefined,
        // Pass the already-fetched activity-department links to avoid a redundant GET /activity-departments call on save
        existingActivityDepartments:
          editingRow.rowType === CountyActivityGridRowType.PRIMARY
            ? (editDetailQuery.data?.activity.activityDepartments ?? [])
            : undefined,
      },
      {
        onSuccess: async () => {
          if (isPrimary && wasActive !== isBecomingActive) {
            const storageKey = `active_subs_before_inactive_${editingRow.id}`

            if (!isBecomingActive) {
              const activeSubIds: string[] = []
              try {
                const children = await fetchCountyActivityNestedRows(queryClient, Number(editingRow.id))
                for (const child of children) {
                  if (child.active) {
                    activeSubIds.push(child.id)
                    const childValues = mapCountyActivityRowToFormValues(child)
                    childValues.active = false
                    try {
                      await apiPutCountyActivity({
                        id: child.id,
                        values: childValues,
                        originalValues: mapCountyActivityRowToFormValues(child),
                        rowType: child.rowType,
                      })
                    } catch (err) {
                      console.error(`Failed to inactivate sub-activity ${child.id}:`, err)
                    }
                  }
                }
              } catch (err) {
                console.error("Failed to fetch sub-activities for inactivation:", err)
              }
              if (activeSubIds.length > 0) {
                sessionStorage.setItem(storageKey, JSON.stringify(activeSubIds))
              }
            } else {
              const stored = sessionStorage.getItem(storageKey)
              if (stored) {
                const idsToRestore = JSON.parse(stored) as string[]
                try {
                  const children = await fetchCountyActivityNestedRows(queryClient, Number(editingRow.id))
                  for (const childId of idsToRestore) {
                    const child = children.find((c) => c.id === childId)
                    if (child && !child.active) {
                      const childValues = mapCountyActivityRowToFormValues(child)
                      childValues.active = true
                      try {
                        await apiPutCountyActivity({
                          id: child.id,
                          values: childValues,
                          originalValues: mapCountyActivityRowToFormValues(child),
                          rowType: child.rowType,
                        })
                      } catch (err) {
                        console.error(`Failed to restore sub-activity ${child.id}:`, err)
                      }
                    }
                  }
                } catch (err) {
                  console.error("Failed to fetch sub-activities for reactivation:", err)
                }
                sessionStorage.removeItem(storageKey)
              }
            }
          }
          toast.success(
            editingRow.rowType === CountyActivityGridRowType.PRIMARY
              ? "Primary county activity updated successfully."
              : "Secondary county activity updated successfully.",
          )
          editForm.reset()
          setEditOpen(false)
          setRowToEdit(null)
          setEditMasterCodesDropdownOpened(false)
          setCodeTypeDropdownOpened(false)
          setEditSelectedPrimaryId(null)

          if (isPrimary && wasActive !== isBecomingActive) {
            setTimeout(() => {
              void queryClient.invalidateQueries({
                predicate: (query) => {
                  const key = query.queryKey
                  if (!Array.isArray(key) || key[0] !== "countyActivityCode") return false
                  // Exclude paged lists (already invalidated by default onSuccess) and activity details (modal is closed)
                  if (key[1] === "paged" || key[1] === "activity-detail") return false
                  return true
                },
              })
            }, 0)
          }
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

    // Guard: block save if the user hasn't changed anything.
    // editFormValuesFromServer is the API-loaded snapshot that drives the form via `values:`.
    if (guardNoChanges(
      values as Record<string, unknown>,
      editFormValuesFromServer as Record<string, unknown>,
    )) return

    const changedFields = getChangedFields(
      values as Record<string, unknown>,
      editFormValuesFromServer as Record<string, unknown>,
    ) as Partial<CountyActivityAddFormValues>

    // The parent cannot be changed via edit — show a clear error and stop.
    if (rowToEdit.rowType === CountyActivityGridRowType.SUB) {
      const originalParentId = (
        editDetailQuery.data?.activity.parent?.id != null
          ? String(editDetailQuery.data.activity.parent.id)
          : rowToEdit.parentId ?? null
      )
      const selectedParentId = editSelectedPrimaryId ?? originalParentId
      if (
        selectedParentId != null &&
        originalParentId != null &&
        String(selectedParentId).trim() !== String(originalParentId).trim()
      ) {
        toast.error("Failed: Cannot update the Parent Activity Code.")
        return
      }
    }

    let masterCatalog: { code: string; type: string } | undefined
    const masterCodeChanged = changedFields.masterCode !== undefined || changedFields.masterCodeType !== undefined
    if (rowToEdit.rowType === CountyActivityGridRowType.PRIMARY && masterCodeChanged) {
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

      if (catalogId <= 0 || !catalog?.code) {
        toast.error("Select a valid master code")
        return
      }
      masterCatalog = { code: catalog.code, type: values.masterCodeType }
    }

    let editDepartmentLinks: { id: number; apportioning?: boolean; manualApportioning?: boolean }[] | undefined
    if (changedFields.department !== undefined) {
      const editAssignedNames = values.department
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      editDepartmentLinks = editAssignedNames
        .map((name) => departmentIdByName[name])
        .filter((id): id is number => typeof id === "number" && !Number.isNaN(id))
        .map((id) => ({ id }))
    }

    const editingRow = rowToEdit
    const isBecomingActive = changedFields.active !== undefined ? changedFields.active : editingRow.active

    if (
      editingRow.rowType === CountyActivityGridRowType.SUB &&
      isBecomingActive &&
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

    doUpdateCountyActivity(editingRow, changedFields, masterCatalog, editDepartmentLinks)
  }, (errors) => {
    console.error("Edit validation errors:", errors)
    toast.error("Please fill all required fields correctly.")
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
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 rounded-[10px] p-3">
        {showHistory ? (
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <TitleCaseInput
                placeholder="Search County Activity Code"
                value={historyActivityCode}
                onChange={(e) => setHistoryActivityCode(e.target.value)}
                className="h-12 w-full sm:w-[220px] rounded-[10px] border border-[#D9D9D9] bg-white px-3.5 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#9CA3AF] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
              <TitleCaseInput
                placeholder="Search County Activity Name"
                value={historyActivityName}
                onChange={(e) => setHistoryActivityName(e.target.value)}
                className="h-12 w-full sm:w-[250px] rounded-[10px] border border-[#D9D9D9] bg-white px-3.5 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#9CA3AF] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
            </div>
          </div>
        ) : (
          <div className="w-full sm:max-w-[300px]">
            <form
              onSubmit={(event) => event.preventDefault()}
              className="relative"
            >
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
              <TitleCaseInput
                placeholder="Search here"
                className="h-12 rounded-[10px] border border-[#D9D9D9] bg-white pl-9 pr-9 text-[16px] text-[#1F2937] placeholder:text-[#9CA3AF]"
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
              {searchValue && searchValue.length > 0 && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#111827] cursor-pointer"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    filterForm.setValue("search", "")
                    if (searchDebounceTimerRef.current !== null) {
                      window.clearTimeout(searchDebounceTimerRef.current)
                      searchDebounceTimerRef.current = null
                    }
                    onSearchChange("")
                    onPageChange(1)
                  }}
                >
                  <X className="size-4" />
                </button>
              )}
            </form>
          </div>
        )}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:ml-auto">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* History toggle button */}
            {isSuperAdmin && (
              <button
                type="button"
                className={`flex-1 sm:flex-initial flex h-12 items-center justify-center gap-2 rounded-[10px] px-4 text-[14px] font-normal transition-colors ${showHistory
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
            )}

            {/* Inactive toggle — hidden while in history view */}
            {!showHistory && (
              <button
                type="button"
                className="flex-1 sm:flex-initial flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[#6C5DD3] px-4 text-white"
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
          </div>

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
                setCodeTypeDropdownOpened(false)
                setAddOpen(true)
              }}
              className="w-full sm:w-auto h-12 rounded-[10px] bg-[#6C5DD3] px-6 text-[14px] font-normal text-white hover:bg-[#5B4DC5]"
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

      {/* ── Mobile card view (hidden on xl+) ────────────────────── */}
      {!showHistory && (
        <div className="block xl:hidden">
          {isLoading ? (
            <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-8 text-center">
              <Spinner className="text-[#6C5DD3] mx-auto" />
            </div>
          ) : sortedRows.length === 0 ? (
            <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-8 text-center text-[13px] text-[#6B7280]">
              No county activity codes found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {sortedRows.map((row) => {
                const isExpanded = Boolean(expandedRowIds[row.id])
                const hasChildren = row.hasChild

                return (
                  <div key={`card-group-${row.id}`} className="space-y-2">
                    {/* Primary card */}
                    <div className="rounded-[10px] border border-[#E5E7EB] bg-white shadow-sm overflow-hidden hover:border-[#6C5DD3]/40 transition-colors flex flex-col">
                      {/* Card header */}
                      <div className="flex items-center justify-between bg-[#6C5DD3] px-4 py-2.5 gap-2">
                        <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-white shrink-0">Code:</span>
                          <span className="text-[13px] font-semibold text-white truncate">{row.countyActivityCode}</span>
                        </div>
                        {hasChildren && (
                          <button
                            type="button"
                            className="inline-flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-white/20 text-white hover:bg-white/30"
                            onClick={() =>
                              setExpandedRowIds((prev) => ({ ...prev, [row.id]: !prev[row.id] }))
                            }
                          >
                            {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                          </button>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-2 text-[13px]">
                          {/* Name */}
                          <div className="flex flex-wrap items-baseline gap-x-1.5">
                            <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold shrink-0">Name:</span>
                            <span className="text-gray-600 font-normal break-words min-w-0">{row.countyActivityName || "—"}</span>
                          </div>
                          {/* Department */}
                          <div className="flex flex-wrap items-baseline gap-x-1.5">
                            <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold shrink-0">Dept:</span>
                            <span className="text-gray-600 font-normal break-words min-w-0">{getCountyActivityCodeRowDepartmentLabel(row)}</span>
                          </div>
                          {/* Master Code Type */}
                          {row.masterCodeType && (
                            <div className="flex flex-wrap items-baseline gap-x-1.5">
                              <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold shrink-0">Code Type:</span>
                              <span className="text-gray-600 font-normal break-words min-w-0">{row.masterCodeType}</span>
                            </div>
                          )}
                          {/* Master Code */}
                          {row.catalogActivityCode && (
                            <div className="flex flex-wrap items-baseline gap-x-1.5">
                              <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold shrink-0">Master Code:</span>
                              <span className="text-gray-600 font-normal break-all min-w-0">{row.catalogActivityCode}</span>
                            </div>
                          )}
                          {/* Flags row */}
                          <div className="flex flex-wrap gap-3 pt-1">
                            {[
                              { label: "SPMP", val: row.spmp },
                              { label: "Active", val: row.active },
                              { label: "Leave", val: row.leaveCode },
                              { label: "Apport.", val: row.apportioning },
                              { label: "Multi-Pool", val: row.multipleJobPools },
                            ].map(({ label, val }) => (
                              <div key={label} className="flex items-center gap-1">
                                <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold">{label}:</span>
                                <img
                                  src={val ? statusCheckImg : statusCrossImg}
                                  alt={val ? "Yes" : "No"}
                                  className="h-3.5 w-3.5 object-contain"
                                />
                              </div>
                            ))}
                            {row.match && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold">Match:</span>
                                <span className="text-gray-600 text-[12px]">{row.match}</span>
                              </div>
                            )}
                            {row.percentage > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold">%:</span>
                                <span className="text-gray-600 text-[12px]">{row.percentage.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                          {/* Description */}
                          {row.description && (
                            <div className="flex flex-wrap items-baseline gap-x-1.5 border-t border-gray-100 pt-2">
                              <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold shrink-0">Desc:</span>
                              <span className="text-gray-500 font-normal text-[12px] break-words min-w-0 line-clamp-2">{row.description}</span>
                            </div>
                          )}
                        </div>

                        {/* Edit action */}
                        {canUpdateCountyActivity && (
                          <div className="flex justify-end pt-2 border-t border-gray-100 mt-2">
                            {row.apportioning === true && row.manualApportioning === true ? (
                              <button
                                type="button"
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[12px] font-medium text-gray-500 cursor-not-allowed opacity-70"
                                disabled
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>View Only</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setRowToEdit(row)
                                  setEditMasterCodesDropdownOpened(false)
                                  setCodeTypeDropdownOpened(false)
                                  setEditSelectedPrimaryId(null)
                                  setEditOpen(true)
                                }}
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[12px] font-medium text-[#6C5DD3] hover:bg-[#F3F0FF] transition-colors"
                              >
                                <img src={editIconImg} alt="Edit" className="h-3.5 w-3.5 object-contain" />
                                <span>Edit</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Sub-cards — rendered inside the parent card container when expanded */}
                      {isExpanded && hasChildren && (
                        <div className="bg-[#F8FAFC] border-t border-[#E5E7EB] p-4 space-y-3">
                          <CountyActivitySubCardsRenderer
                            parentId={row.id}
                            canUpdateCountyActivity={canUpdateCountyActivity}
                            onEditRow={(child) => {
                              setRowToEdit(child)
                              setEditMasterCodesDropdownOpened(false)
                              setCodeTypeDropdownOpened(false)
                              setEditSelectedPrimaryId(null)
                              setEditOpen(true)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Desktop table (hidden below xl) ─────────────────────── */}
      <div className={`hidden xl:block overflow-x-auto rounded-[10px] border border-[#E5E7EB] ${showHistory ? "!hidden" : ""}`}>
        <Table className="w-full min-w-[900px] table-fixed border-collapse">
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
            <TableRow className="h-[72px] bg-[#6C5DD3] hover:bg-[#6C5DD3]">
              {[
                ...COUNTY_ACTIVITY_TABLE_COLUMNS,
                ...(canUpdateCountyActivity ? [COUNTY_ACTIVITY_ACTION_COLUMN] : []),
              ].map((column) => (
                <TableHead
                  key={column.key}
                  className={`h-[72px] align-middle border-r border-[#FFFFFF66] bg-[#6C5DD3] px-[8px] py-[6px] text-[13px] font-[500] leading-tight text-white font-['Roboto',sans-serif] last:border-r-0 ${
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
                            className={`flex max-w-full cursor-pointer items-center gap-2 font-[400] h-auto ${
                              column.align === "center" ? "mx-auto justify-center text-center" : "justify-start text-left"
                            }`}
                          >
                            <span className="leading-tight font-normal whitespace-normal break-words">
                              {renderCountyActivityHeaderLabel(column.labelLines)}
                            </span>
                            <span className="inline-flex shrink-0 flex-col">
                              <span
                                className={`h-0 w-0 border-b-[5px] border-l-[4px] border-r-[4px] border-l-transparent border-r-transparent ${sortBy === column.sortKey && sortDirection === "asc"
                                    ? "border-b-[#1E8BFF]"
                                    : "border-b-white/60"
                                  }`}
                              />
                              <span
                                className={`mt-0.5 h-0 w-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent ${sortBy === column.sortKey && sortDirection === "desc"
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
                    <div className={`flex items-center leading-tight font-[400] ${
                      column.align === "center" ? "justify-center" : "justify-start"
                    }`}>
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
                    <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                      <Skeleton className="h-4 w-[90%]" />
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-left text-[14px] leading-[1.4] whitespace-normal break-words font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                      <Skeleton className="h-4 w-[95%]" />
                    </TableCell>
                    <TableCell className="min-w-0 max-w-0 border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                      <Skeleton className="h-4 w-[100%]" />
                    </TableCell>
                    <TableCell className="min-w-0 border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                      <Skeleton className="h-4 w-[70%]" />
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                      <Skeleton className="h-4 w-[80%]" />
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                      <Skeleton className="h-4 w-[60%]" />
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center text-[13px] text-[#C4C4C4]">
                      <Skeleton className="mx-auto h-4 w-4" />
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                      <Skeleton className="mx-auto h-4 w-[40%]" />
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-[8px] py-[5px] align-middle text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
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
                    <TableCell className="px-[14px] py-[5px] align-middle text-center">
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
                    const hasChildren = row.hasChild

                    const countyActivityPrimaryTableRow = (
                      <TableRow key={row.id} className="ieba-data-row border-b border-[#E5E7EB]">
                        <TableCell className="border-r border-[#E5E7EB] px-[10px] py-[5px] align-middle text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0] whitespace-nowrap">
                          <div className="flex items-start gap-1">
                            <button
                              type="button"
                              className={`inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] ${hasChildren ? "text-[#6C5DD3] hover:bg-[#6C5DD3]/10" : "opacity-0 pointer-events-none"
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
                            <span className="flex-1 whitespace-nowrap">
                              {row.countyActivityCode}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-left text-[14px] leading-[1.4] whitespace-normal break-words font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          {row.countyActivityName}
                        </TableCell>
                        <CountyActivityDescriptionTableCell description={row.description} />
                        <TableCell className="min-w-0 border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-left text-[14px] leading-[1.4] whitespace-normal break-words font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          <CountyActivityDepartmentStackCell label={getCountyActivityCodeRowDepartmentLabel(row)} />
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0] whitespace-normal break-words">
                          {row.masterCodeType}
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-left text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0] whitespace-normal break-all">
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
                        <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[5px] align-middle text-center text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
                          {row.match}
                        </TableCell>
                        <TableCell className="border-r border-[#E5E7EB] px-[8px] py-[5px] align-middle text-[14px] font-[400] font-['Roboto',sans-serif] text-[#000000E0]">
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
                          <TableCell className="px-[14px] py-[5px] align-middle text-center">
                            {row.apportioning === true && row.manualApportioning === true ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                                      onClick={() => {
                                        setRowToEdit(row)
                                        setEditMasterCodesDropdownOpened(false)
                                        setCodeTypeDropdownOpened(false)
                                        setEditSelectedPrimaryId(null)
                                        setEditOpen(true)
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    align="center"
                                    sideOffset={6}
                                    className="z-50 !inline-block rounded-[8px] border-0 bg-black px-3 py-2.5 text-left text-[12px] font-medium leading-relaxed text-white shadow-lg"
                                  >
                                    Auto-created manual activity cannot be modified
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                                onClick={() => {
                                  setRowToEdit(row)
                                  setEditMasterCodesDropdownOpened(false)
                                  setCodeTypeDropdownOpened(false)
                                  setEditSelectedPrimaryId(null)
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
                        )}
                      </TableRow>
                    )

                    const subRows = isExpanded && hasChildren ? (
                      <CountyActivitySubTableRowsRenderer
                        key={`sub-${row.id}`}
                        parentId={row.id}
                        canUpdateCountyActivity={canUpdateCountyActivity}
                        onEditRow={(child) => {
                          setRowToEdit(child)
                          setEditMasterCodesDropdownOpened(false)
                          setCodeTypeDropdownOpened(false)
                          setEditSelectedPrimaryId(null)
                          setEditOpen(true)
                        }}
                      />
                    ) : null

                    return [countyActivityPrimaryTableRow, subRows].filter(Boolean)
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

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddOpen(false)
            setCodeTypeDropdownOpened(false)
            setPrimaryPickerOpened(false)
            addForm.reset(countyActivityAddDefaultValues)
            if (hasCreatedNew) {
              void queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.pagedLists() })
              setHasCreatedNew(false)
            }
          } else {
            setAddOpen(true)
          }
        }}
      >
        <DialogContent
          showClose={false}
          className="fixed inset-0 z-50 overflow-y-auto grid place-items-center bg-transparent border-none shadow-none p-0 left-0 top-0 translate-x-0 translate-y-0 max-w-none w-screen h-screen"
          overlayClassName="bg-black/50"
        >
          <div className="relative my-4 sm:my-8 w-full px-2 sm:px-0 sm:w-[900px] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)]">
            <CountyActivityCodeAddPage
            key={addFormMountKey}
            form={addForm}
            onAddSave={submitCreateCountyActivityFromAddModal}
            subParentActivityDetail={addSubParentDetailQuery.data ?? null}
            tab={addTab}
            masterCodeTypeOptions={masterCodeTypeOptions}
            isMasterCodeTypeOptionsLoading={masterCatalogQuery.isLoading}
            masterCodeOptions={addMasterCodeOptions}
            isMasterCodeOptionsLoading={addMasterCodesQuery.isLoading}
            departmentNames={departmentNames}
            onCodeDropdownOpen={() => {
              void addMasterCodesQuery.refetch()
            }}
            onCodeTypeDropdownOpen={() => setCodeTypeDropdownOpened(true)}
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
            onPrimaryPickerDropdownOpen={() => setPrimaryPickerOpened(true)}
            onClose={() => {
              setAddOpen(false)
              setCodeTypeDropdownOpened(false)
              setPrimaryPickerOpened(false)
              if (hasCreatedNew) {
                void queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.pagedLists() })
                setHasCreatedNew(false)
              }
            }}
            isSubmitting={createCountyActivityCode.isPending}
            isEditSourceLoading={addTab === CountyActivityGridRowType.SUB && addSubParentDetailQuery.isLoading}
            apportioningDepartments={addSubParentDetailQuery.data?.apportioningDepartments}
          />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditOpen(false)
            setRowToEdit(null)
            setEditMasterCodesDropdownOpened(false)
            setCodeTypeDropdownOpened(false)
            setPrimaryPickerOpened(false)
            setEditSelectedPrimaryId(null)
            editForm.reset(countyActivityAddDefaultValues)
          } else {
            setEditOpen(true)
          }
        }}
      >
        <DialogContent
          showClose={false}
          className="fixed inset-0 z-50 overflow-y-auto grid place-items-center bg-transparent border-none shadow-none p-0 left-0 top-0 translate-x-0 translate-y-0 max-w-none w-screen h-screen"
          overlayClassName="bg-black/50"
        >
          <div className="relative my-4 sm:my-8 w-full px-2 sm:px-0 sm:w-[1000px] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)]">
            {editDetailQuery.isLoading && editOpen ? (
              <div className="flex h-[500px] w-full items-center justify-center rounded-[10px] bg-white border border-[#EBEDF0]">
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
              readOnly={rowToEdit.apportioning === true && rowToEdit.manualApportioning === true}
              primaryActivityCodeOptions={editModalPrimaryActivityOptions}
              selectedPrimaryId={
                rowToEdit.rowType === CountyActivityGridRowType.SUB
                  ? (editDetailQuery.data?.activity.parent?.id != null
                    ? String(editDetailQuery.data.activity.parent.id)
                    : rowToEdit.parentId ?? null)
                  : null
              }
              readOnlyPrimaryPicker={false}
              masterCodeTypeOptions={masterCodeTypeOptions}
              isMasterCodeTypeOptionsLoading={masterCatalogQuery.isLoading}
              masterCodeOptions={editMasterCodeOptions}
              isMasterCodeOptionsLoading={editMasterCodesQuery.isLoading}
              isEditSourceLoading={
                editDetailQuery.isLoading ||
                (rowToEdit?.rowType === CountyActivityGridRowType.PRIMARY &&
                  editMasterCodesQuery.isLoading)
              }
              initialDepartmentShuttle={
                rowToEdit.rowType === CountyActivityGridRowType.PRIMARY &&
                editDetailQuery.data?.activity
                  ? {
                      assigned:
                        editDetailQuery.data.activity.assignedDepartments ??
                        editDetailQuery.data.activity.departments ??
                        [],
                      unassigned: editDetailQuery.data.activity.unassignedDepartments ?? [],
                    }
                  : undefined
              }
              departmentNames={editModalDepartmentNames}
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
              onCodeDropdownOpen={() => {
                setEditMasterCodesDropdownOpened(true)
                void editMasterCodesQuery.refetch()
              }}
              onCodeTypeDropdownOpen={() => setCodeTypeDropdownOpened(true)}
              onPrimaryPickerDropdownOpen={() => setPrimaryPickerOpened(true)}
              onEditSave={() => {
                void submitCountyActivityEditFromEditModal()
              }}
              onClose={() => {
                setEditOpen(false)
                setRowToEdit(null)
                setEditMasterCodesDropdownOpened(false)
                setCodeTypeDropdownOpened(false)
                setPrimaryPickerOpened(false)
                setEditSelectedPrimaryId(null)
                editForm.reset(countyActivityAddDefaultValues)
              }}
              isSubmitting={updateCountyActivityCode.isPending}
            />
          ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
