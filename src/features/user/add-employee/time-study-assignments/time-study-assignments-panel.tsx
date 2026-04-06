import { Check, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { useFormContext } from "react-hook-form"
import { toast } from "sonner"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"

import type {
  AddEmployeeDepartmentOption,
  AddEmployeeTimeStudyTransferItem,
  AddEmployeeTimeStudyTransferPanelProps,
  UserModuleFormMode,
  UserModuleFormValues,
  UserProgramsActivitiesDepartmentBundle,
} from "../types"

import {
  useAssignUserActivitiesTs,
  useAssignUserProgramsTs,
  useUnassignUserActivitiesTs,
  useUnassignUserProgramsTs,
} from "../mutations/time-study-program-activity-transfer"
import {
  useGetAddEmployeeActivitiesCatalog,
  useGetAddEmployeeDepartments,
  useGetAddEmployeeTimeStudyPrograms,
  useGetUserProgramsAndActivities,
} from "../queries/get-add-employee"

function TransferPanel({
  title,
  items,
  selectedIds,
  onToggleItem,
  searchValue,
  onSearchChange,
  selectedDept,
}: AddEmployeeTimeStudyTransferPanelProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white">
      <div className="flex h-10 items-center justify-between gap-3 bg-[#6C5DD3] px-3 text-[11px] font-medium text-white">
        <span className="flex-1">
          {title}
        </span>
      </div>

      <div className="border-b border-[#E5E7EB] p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            placeholder="Search here"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 rounded-[8px] border-[#E5E7EB] bg-white pl-9 text-[12px] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#6C5DD3] transition-all"
          />
        </div>
      </div>

      <ScrollArea className="h-[220px] py-2 px-2">
        {items.length > 0 ? (
          <div className="flex flex-col">
            <div className="flex h-7 items-center justify-between bg-[#F3F4F6] px-4 text-[10px] font-semibold text-[#374151]">
              <span>{selectedDept}</span>
            </div>
            <div className="px-6 py-0.5">
              <span className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1 text-[10px] font-bold text-[#374151] shadow-sm">
                {title.includes("Activities") ? "Activities" : "Programs"}
              </span>
            </div>

            <div className="flex flex-col pb-2">
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleItem(item.id)}
                    className={`group relative flex cursor-pointer items-center justify-between px-9 py-1 text-left transition-colors ${
                      isSelected ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="absolute left-6 top-0.5 flex h-full w-8 items-center justify-center">
                        <div className="absolute left-4 top-0 h-full w-px bg-[#E5E7EB]" />
                        <div className="absolute left-4 top-1/2 h-px w-3 bg-[#E5E7EB]" />
                      </div>
                      <div className="pl-6 text-[10px] font-medium whitespace-normal break-words">
                        {item.code ? (
                          <>
                            <div className="font-bold text-[#6C5DD3]">({item.code})</div>
                            <div className={isSelected ? "text-[#6C5DD3]" : "text-[#111827]"}>
                              {item.name}
                            </div>
                          </>
                        ) : (
                          <div className={isSelected ? "text-[#6C5DD3]" : "text-[#111827]"}>
                            {item.name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
                        isSelected
                          ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                          : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                      }`}
                    >
                      <Check className="size-3.5 stroke-[3]" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex h-[220px] flex-col items-center justify-center bg-white">
            <img src={tableEmptyIcon} alt="Empty" className="size-20 object-contain opacity-80" />
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function filterBySearch(items: AddEmployeeTimeStudyTransferItem[], search: string) {
  const q = search.trim().toLowerCase()
  if (!q) return items
  return items.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      (i.code ?? "").toLowerCase().includes(q) ||
      i.department.toLowerCase().includes(q),
  )
}

function toggleList(prev: string[], id: string) {
  return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
}

function parseDepartmentNumericId(row: AddEmployeeDepartmentOption): number | null {
  const n = Number.parseInt(String(row.id).trim(), 10)
  return Number.isFinite(n) && n >= 1 ? n : null
}

/** Resolve department id for POST /users/new/assign/activity (matches claiming unit / dropdown name). */
function departmentIdByClaimingUnitName(
  departments: AddEmployeeDepartmentOption[] | undefined,
  claimingUnitName: string,
): number | null {
  const target = claimingUnitName.trim().toLowerCase()
  if (!target) return null
  for (const d of departments ?? []) {
    if (d.name.trim().toLowerCase() === target) {
      return parseDepartmentNumericId(d)
    }
  }
  return null
}

function parsePositiveIntIds(ids: string[]): number[] {
  const out: number[] = []
  for (const s of ids) {
    const n = Number.parseInt(s, 10)
    if (Number.isFinite(n) && n >= 1) out.push(n)
  }
  return out
}

/** Maps GET /timestudyprograms/user/programs-activities bundles to flat transfer rows (deduped by id). */
function buildCatalogItemsFromUserProgramsActivitiesResponse(
  bundles: UserProgramsActivitiesDepartmentBundle[],
): { programs: AddEmployeeTimeStudyTransferItem[]; activities: AddEmployeeTimeStudyTransferItem[] } {
  const programById = new Map<string, AddEmployeeTimeStudyTransferItem>()
  const activityById = new Map<string, AddEmployeeTimeStudyTransferItem>()
  for (const b of bundles) {
    const dept = b.departmentName.trim()
    if (!dept) continue
    for (const p of b.programs) {
      const id = String(p.id)
      if (!programById.has(id)) {
        programById.set(id, { id, code: p.code, name: p.name, department: dept })
      }
    }
    for (const a of b.activities) {
      const id = String(a.id)
      if (!activityById.has(id)) {
        activityById.set(id, { id, code: a.code, name: a.name, department: dept })
      }
    }
  }
  return {
    programs: [...programById.values()],
    activities: [...activityById.values()],
  }
}

type TimeStudyPlacementOverride = "assigned" | "unassigned"
type TimeStudyPlacementOverrideMap = Record<string, TimeStudyPlacementOverride>

function timeStudyPlacementOverrideKey(departmentName: string, rowId: string): string {
  return `${departmentName.trim()}::${rowId}`
}

function compareTransferItems(a: AddEmployeeTimeStudyTransferItem, b: AddEmployeeTimeStudyTransferItem): number {
  const c = (a.code ?? "").localeCompare(b.code ?? "", undefined, { sensitivity: "base", numeric: true })
  if (c !== 0) return c
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
}

function sortTransferItems(items: AddEmployeeTimeStudyTransferItem[]): AddEmployeeTimeStudyTransferItem[] {
  return [...items].sort(compareTransferItems)
}

/** Whether a row is on the assigned side: user override wins, else default from user bundle API. */
function isTransferItemAssignedInEditMode(
  departmentName: string,
  rowId: string,
  idsMarkedAssignedByUserBundleForDepartment: ReadonlySet<string>,
  placementOverrides: TimeStudyPlacementOverrideMap,
): boolean {
  const override = placementOverrides[timeStudyPlacementOverrideKey(departmentName, rowId)]
  if (override === "unassigned") return false
  if (override === "assigned") return true
  return idsMarkedAssignedByUserBundleForDepartment.has(rowId)
}

/**
 * Updates placement overrides; drops entries that match bundle default so the UI tracks only diffs.
 * Keys are scoped by department so changing the department filter does not reuse wrong overrides.
 */
function mergeTimeStudyPlacementOverrides(
  previous: TimeStudyPlacementOverrideMap,
  departmentName: string,
  rowIds: string[],
  targetPlacement: TimeStudyPlacementOverride,
  idsAssignedByDefaultFromUserBundleForDepartment: ReadonlySet<string>,
): TimeStudyPlacementOverrideMap {
  const next: TimeStudyPlacementOverrideMap = { ...previous }
  const wantAssigned = targetPlacement === "assigned"
  const dept = departmentName.trim()
  for (const rowId of rowIds) {
    const key = timeStudyPlacementOverrideKey(dept, rowId)
    const defaultAssigned = idsAssignedByDefaultFromUserBundleForDepartment.has(rowId)
    if (wantAssigned === defaultAssigned) {
      delete next[key]
    } else {
      next[key] = targetPlacement
    }
  }
  return next
}

function filterTransferItemsByDepartment(
  items: AddEmployeeTimeStudyTransferItem[],
  departmentName: string,
): AddEmployeeTimeStudyTransferItem[] {
  const d = departmentName.trim()
  if (!d) return []
  return items.filter((row) => row.department === d)
}

/** Assigned column: global rows + bundle-only rows the user is considered assigned to. */
function buildAssignedItemsForEditMode(
  globalRowsForDepartment: AddEmployeeTimeStudyTransferItem[],
  bundleRowsForDepartment: AddEmployeeTimeStudyTransferItem[],
  isAssigned: (id: string) => boolean,
): AddEmployeeTimeStudyTransferItem[] {
  const byId = new Map<string, AddEmployeeTimeStudyTransferItem>()
  for (const row of globalRowsForDepartment) {
    if (isAssigned(row.id)) byId.set(row.id, row)
  }
  for (const row of bundleRowsForDepartment) {
    if (isAssigned(row.id) && !byId.has(row.id)) byId.set(row.id, row)
  }
  return sortTransferItems([...byId.values()])
}

function buildUnassignedItemsForEditMode(
  globalRowsForDepartment: AddEmployeeTimeStudyTransferItem[],
  isAssigned: (id: string) => boolean,
): AddEmployeeTimeStudyTransferItem[] {
  return sortTransferItems(globalRowsForDepartment.filter((row) => !isAssigned(row.id)))
}

export type TimeStudyAssignmentsPanelProps = {
  mode: UserModuleFormMode
  /** Profile user id — same as Security tab; required for edit-mode user-scoped programs/activities. */
  timeStudyContextUserId?: string | null
}

/** UI tab: Time Study Assignments */
export function TimeStudyAssignmentsPanel({
  mode,
  timeStudyContextUserId,
}: TimeStudyAssignmentsPanelProps) {
  const userIdForTs = (timeStudyContextUserId ?? "").trim()
  const isEditTimeStudyWithUserBundle = mode === "edit" && Boolean(userIdForTs)
  const canPersistTsTransfers = userIdForTs.length > 0

  const assignProgramsMutation = useAssignUserProgramsTs()
  const unassignProgramsMutation = useUnassignUserProgramsTs()
  const assignActivitiesMutation = useAssignUserActivitiesTs()
  const unassignActivitiesMutation = useUnassignUserActivitiesTs()
  const tsTransferBusy =
    assignProgramsMutation.isPending ||
    unassignProgramsMutation.isPending ||
    assignActivitiesMutation.isPending ||
    unassignActivitiesMutation.isPending

  const departmentsQuery = useGetAddEmployeeDepartments(true)
  const programsQuery = useGetAddEmployeeTimeStudyPrograms(true)
  const activitiesQuery = useGetAddEmployeeActivitiesCatalog(true)
  const userProgramsActivitiesQuery = useGetUserProgramsAndActivities(userIdForTs, isEditTimeStudyWithUserBundle)

  /** Edit: after department change we refetch full program/activity catalogs — block transfers until settled. */
  const tsCatalogRefetchBusy =
    isEditTimeStudyWithUserBundle &&
    (programsQuery.isFetching || activitiesQuery.isFetching)

  const { register, watch, setValue } = useFormContext<UserModuleFormValues>()
  const isAddMode = mode === "add"
  const employeeName = `${watch("firstName") ?? ""} ${watch("lastName") ?? ""}`.trim()

  /** Departments on the user’s programs/activities bundles (for defaults + assigned/unassigned logic). */
  const bundleDepartmentNames = useMemo(() => {
    const bundles = userProgramsActivitiesQuery.data ?? []
    const names = bundles.map((b) => b.departmentName.trim()).filter((n) => n.length > 0)
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  }, [userProgramsActivitiesQuery.data])

  /** GET /departments — full catalog for add + edit Time Study department dropdowns. */
  const masterDepartmentNames = useMemo(
    () => (departmentsQuery.data ?? []).map((d) => d.name).filter((n) => n.length > 0),
    [departmentsQuery.data],
  )

  const departmentSelectOptionsFromMaster = useMemo(
    () => masterDepartmentNames.map((name) => ({ value: name, label: name })),
    [masterDepartmentNames],
  )

  const userBundleCatalog = useMemo(
    () => buildCatalogItemsFromUserProgramsActivitiesResponse(userProgramsActivitiesQuery.data ?? []),
    [userProgramsActivitiesQuery.data],
  )

  const globalProgramCatalog = useMemo<AddEmployeeTimeStudyTransferItem[]>(() => {
    const rows = programsQuery.data ?? []
    return rows.map((p) => ({
      id: p.id,
      department: p.department,
      code: p.code,
      name: p.name,
    }))
  }, [programsQuery.data])

  const departmentDropdownLoading =
    departmentsQuery.isPending ||
    departmentsQuery.isFetching ||
    programsQuery.isPending ||
    activitiesQuery.isPending ||
    (isEditTimeStudyWithUserBundle && userProgramsActivitiesQuery.isPending)

  const [searchProgramsU, setSearchProgramsU] = useState("")
  const [searchProgramsA, setSearchProgramsA] = useState("")
  const [searchActivitiesU, setSearchActivitiesU] = useState("")
  const [searchActivitiesA, setSearchActivitiesA] = useState("")

  const [assignedProgramIdsAddMode, setAssignedProgramIdsAddMode] = useState<string[]>([])
  const [assignedActivityIdsAddMode, setAssignedActivityIdsAddMode] = useState<string[]>([])
  const [programPlacementOverridesEditMode, setProgramPlacementOverridesEditMode] =
    useState<TimeStudyPlacementOverrideMap>({})
  const [activityPlacementOverridesEditMode, setActivityPlacementOverridesEditMode] =
    useState<TimeStudyPlacementOverrideMap>({})

  const [toggledProgramsU, setToggledProgramsU] = useState<string[]>([])
  const [toggledProgramsA, setToggledProgramsA] = useState<string[]>([])
  const [toggledActivitiesU, setToggledActivitiesU] = useState<string[]>([])
  const [toggledActivitiesA, setToggledActivitiesA] = useState<string[]>([])

  /**
   * Add mode: Time Study department starts empty each visit (independent of Employee tab claiming unit)
   * until the user picks a department here; then we sync to `claimingUnit` for save/API.
   */
  const [timeStudyDeptAddMode, setTimeStudyDeptAddMode] = useState("")
  /** Edit: Time Study department filter (dropdown = full GET /departments list; not `claimingUnit`). */
  const [timeStudyDeptEditMode, setTimeStudyDeptEditMode] = useState("")

  const selectedDept = isAddMode
    ? timeStudyDeptAddMode.trim()
    : timeStudyDeptEditMode.trim() || (bundleDepartmentNames[0] ?? "")

  const globalActivityCatalog = useMemo<AddEmployeeTimeStudyTransferItem[]>(() => {
    const rows = activitiesQuery.data ?? []
    const deptLabel = selectedDept
    return rows.map((a) => ({
      id: String(a.id),
      department: deptLabel,
      code: a.activityCode,
      name: a.name,
    }))
  }, [activitiesQuery.data, selectedDept])

  const programCatalogForAddMode = globalProgramCatalog
  const activityCatalogForAddMode = globalActivityCatalog

  const bundleProgramIdsForSelectedDepartment = useMemo(() => {
    return new Set(
      filterTransferItemsByDepartment(userBundleCatalog.programs, selectedDept).map((p) => p.id),
    )
  }, [userBundleCatalog.programs, selectedDept])

  const bundleActivityIdsForSelectedDepartment = useMemo(() => {
    return new Set(
      filterTransferItemsByDepartment(userBundleCatalog.activities, selectedDept).map((a) => a.id),
    )
  }, [userBundleCatalog.activities, selectedDept])

  const bundleProgramsForSelectedDepartment = useMemo(
    () => filterTransferItemsByDepartment(userBundleCatalog.programs, selectedDept),
    [userBundleCatalog.programs, selectedDept],
  )

  const bundleActivitiesForSelectedDepartment = useMemo(
    () => filterTransferItemsByDepartment(userBundleCatalog.activities, selectedDept),
    [userBundleCatalog.activities, selectedDept],
  )

  const globalProgramsForSelectedDepartment = useMemo(
    () => filterTransferItemsByDepartment(globalProgramCatalog, selectedDept),
    [globalProgramCatalog, selectedDept],
  )

  const globalActivitiesForSelectedDepartment = useMemo(
    () => filterTransferItemsByDepartment(globalActivityCatalog, selectedDept),
    [globalActivityCatalog, selectedDept],
  )

  const programAssignedPredicateEditMode = useMemo(
    () => (rowId: string) =>
      isTransferItemAssignedInEditMode(
        selectedDept,
        rowId,
        bundleProgramIdsForSelectedDepartment,
        programPlacementOverridesEditMode,
      ),
    [selectedDept, bundleProgramIdsForSelectedDepartment, programPlacementOverridesEditMode],
  )

  const activityAssignedPredicateEditMode = useMemo(
    () => (rowId: string) =>
      isTransferItemAssignedInEditMode(
        selectedDept,
        rowId,
        bundleActivityIdsForSelectedDepartment,
        activityPlacementOverridesEditMode,
      ),
    [selectedDept, bundleActivityIdsForSelectedDepartment, activityPlacementOverridesEditMode],
  )

  const deptProgramsAddMode = useMemo(
    () => filterTransferItemsByDepartment(programCatalogForAddMode, selectedDept),
    [programCatalogForAddMode, selectedDept],
  )

  const deptActivitiesAddMode = useMemo(() => {
    if (!selectedDept) return []
    return filterTransferItemsByDepartment(activityCatalogForAddMode, selectedDept)
  }, [activityCatalogForAddMode, selectedDept])

  const programsUnassigned = useMemo(() => {
    if (isEditTimeStudyWithUserBundle) {
      return buildUnassignedItemsForEditMode(
        globalProgramsForSelectedDepartment,
        programAssignedPredicateEditMode,
      )
    }
    return deptProgramsAddMode.filter((p) => !assignedProgramIdsAddMode.includes(p.id))
  }, [
    isEditTimeStudyWithUserBundle,
    globalProgramsForSelectedDepartment,
    programAssignedPredicateEditMode,
    deptProgramsAddMode,
    assignedProgramIdsAddMode,
  ])

  const programsAssigned = useMemo(() => {
    if (isEditTimeStudyWithUserBundle) {
      return buildAssignedItemsForEditMode(
        globalProgramsForSelectedDepartment,
        bundleProgramsForSelectedDepartment,
        programAssignedPredicateEditMode,
      )
    }
    return deptProgramsAddMode.filter((p) => assignedProgramIdsAddMode.includes(p.id))
  }, [
    isEditTimeStudyWithUserBundle,
    globalProgramsForSelectedDepartment,
    bundleProgramsForSelectedDepartment,
    programAssignedPredicateEditMode,
    deptProgramsAddMode,
    assignedProgramIdsAddMode,
  ])

  const activitiesUnassigned = useMemo(() => {
    if (isEditTimeStudyWithUserBundle) {
      return buildUnassignedItemsForEditMode(
        globalActivitiesForSelectedDepartment,
        activityAssignedPredicateEditMode,
      )
    }
    return deptActivitiesAddMode.filter((a) => !assignedActivityIdsAddMode.includes(a.id))
  }, [
    isEditTimeStudyWithUserBundle,
    globalActivitiesForSelectedDepartment,
    activityAssignedPredicateEditMode,
    deptActivitiesAddMode,
    assignedActivityIdsAddMode,
  ])

  const activitiesAssigned = useMemo(() => {
    if (isEditTimeStudyWithUserBundle) {
      return buildAssignedItemsForEditMode(
        globalActivitiesForSelectedDepartment,
        bundleActivitiesForSelectedDepartment,
        activityAssignedPredicateEditMode,
      )
    }
    return deptActivitiesAddMode.filter((a) => assignedActivityIdsAddMode.includes(a.id))
  }, [
    isEditTimeStudyWithUserBundle,
    globalActivitiesForSelectedDepartment,
    bundleActivitiesForSelectedDepartment,
    activityAssignedPredicateEditMode,
    deptActivitiesAddMode,
    assignedActivityIdsAddMode,
  ])

  const filteredProgramsU = useMemo(
    () => filterBySearch(programsUnassigned, searchProgramsU),
    [programsUnassigned, searchProgramsU],
  )
  const filteredProgramsA = useMemo(
    () => filterBySearch(programsAssigned, searchProgramsA),
    [programsAssigned, searchProgramsA],
  )
  const filteredActivitiesU = useMemo(
    () => filterBySearch(activitiesUnassigned, searchActivitiesU),
    [activitiesUnassigned, searchActivitiesU],
  )
  const filteredActivitiesA = useMemo(
    () => filterBySearch(activitiesAssigned, searchActivitiesA),
    [activitiesAssigned, searchActivitiesA],
  )

  const moveSelectedProgramsToAssignedColumn = async () => {
    if (toggledProgramsU.length === 0) return
    const programIds = parsePositiveIntIds(toggledProgramsU)
    if (programIds.length === 0) {
      setToggledProgramsU([])
      return
    }

    if (canPersistTsTransfers) {
      try {
        await assignProgramsMutation.mutateAsync({ userId: userIdForTs, programs: programIds })
        toast.success("Programs assigned.")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to assign programs")
        return
      }
    }

    if (isEditTimeStudyWithUserBundle) {
      setProgramPlacementOverridesEditMode((prev) =>
        mergeTimeStudyPlacementOverrides(
          prev,
          selectedDept,
          toggledProgramsU,
          "assigned",
          bundleProgramIdsForSelectedDepartment,
        ),
      )
    } else {
      setAssignedProgramIdsAddMode((prev) => Array.from(new Set([...prev, ...toggledProgramsU])))
    }
    setToggledProgramsU([])
  }

  const moveSelectedProgramsToUnassignedColumn = async () => {
    if (toggledProgramsA.length === 0) return
    const programIds = parsePositiveIntIds(toggledProgramsA)
    if (programIds.length === 0) {
      setToggledProgramsA([])
      return
    }

    if (canPersistTsTransfers) {
      try {
        await unassignProgramsMutation.mutateAsync({ userId: userIdForTs, programs: programIds })
        toast.success("Programs unassigned.")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to unassign programs")
        return
      }
    }

    if (isEditTimeStudyWithUserBundle) {
      setProgramPlacementOverridesEditMode((prev) =>
        mergeTimeStudyPlacementOverrides(
          prev,
          selectedDept,
          toggledProgramsA,
          "unassigned",
          bundleProgramIdsForSelectedDepartment,
        ),
      )
    } else {
      setAssignedProgramIdsAddMode((prev) => prev.filter((id) => !toggledProgramsA.includes(id)))
    }
    setToggledProgramsA([])
  }

  const moveSelectedActivitiesToAssignedColumn = async () => {
    if (toggledActivitiesU.length === 0) return
    const activityIds = parsePositiveIntIds(toggledActivitiesU)
    if (activityIds.length === 0) {
      setToggledActivitiesU([])
      return
    }

    if (canPersistTsTransfers) {
      const deptId = departmentIdByClaimingUnitName(departmentsQuery.data, selectedDept)
      if (deptId == null) {
        toast.error("Select a department from the list before assigning activities.")
        return
      }
      try {
        await assignActivitiesMutation.mutateAsync({
          userId: userIdForTs,
          departmentId: deptId,
          countyActivity: activityIds,
        })
        toast.success("Activities assigned.")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to assign activities")
        return
      }
    }

    if (isEditTimeStudyWithUserBundle) {
      setActivityPlacementOverridesEditMode((prev) =>
        mergeTimeStudyPlacementOverrides(
          prev,
          selectedDept,
          toggledActivitiesU,
          "assigned",
          bundleActivityIdsForSelectedDepartment,
        ),
      )
    } else {
      setAssignedActivityIdsAddMode((prev) => Array.from(new Set([...prev, ...toggledActivitiesU])))
    }
    setToggledActivitiesU([])
  }

  const moveSelectedActivitiesToUnassignedColumn = async () => {
    if (toggledActivitiesA.length === 0) return
    const activityIds = parsePositiveIntIds(toggledActivitiesA)
    if (activityIds.length === 0) {
      setToggledActivitiesA([])
      return
    }

    if (canPersistTsTransfers) {
      const deptId = departmentIdByClaimingUnitName(departmentsQuery.data, selectedDept)
      if (deptId == null) {
        toast.error("Select a department from the list before unassigning activities.")
        return
      }
      try {
        await unassignActivitiesMutation.mutateAsync({
          userId: userIdForTs,
          departmentId: deptId,
          countyActivity: activityIds,
        })
        toast.success("Activities unassigned.")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to unassign activities")
        return
      }
    }

    if (isEditTimeStudyWithUserBundle) {
      setActivityPlacementOverridesEditMode((prev) =>
        mergeTimeStudyPlacementOverrides(
          prev,
          selectedDept,
          toggledActivitiesA,
          "unassigned",
          bundleActivityIdsForSelectedDepartment,
        ),
      )
    } else {
      setAssignedActivityIdsAddMode((prev) => prev.filter((id) => !toggledActivitiesA.includes(id)))
    }
    setToggledActivitiesA([])
  }

  return (
    <div className="pt-2">
      <p className="mb-4 select-none text-[12px] font-semibold uppercase text-[#111827]">
        {employeeName}
      </p>

      {isEditTimeStudyWithUserBundle && userProgramsActivitiesQuery.isError ? (
        <p className="mb-3 text-[11px] text-red-500" role="alert">
          {userProgramsActivitiesQuery.error instanceof Error
            ? userProgramsActivitiesQuery.error.message
            : "Failed to load time study programs and activities for this user"}
        </p>
      ) : null}

      <div className="flex items-end justify-between gap-6">
        <div className="w-full max-w-[306px]">
          {isAddMode ? (
            <div>
              <p className="mb-1 block select-none text-[11px] font-medium text-[#2a2f3a]">Department</p>
              <SingleSelectDropdown
                value={timeStudyDeptAddMode}
                onChange={(value) => {
                  setTimeStudyDeptAddMode(value)
                  setValue("claimingUnit", value, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                }}
                onBlur={() => {}}
                options={departmentSelectOptionsFromMaster}
                placeholder={
                  masterDepartmentNames.length === 0 ? "No departments loaded" : "Select department"
                }
                isLoading={departmentDropdownLoading}
                contentClassName="max-h-[180px]"
                className="min-h-[46px] rounded-[7px] border-[#c6cedd] text-[11px] leading-[14px]"
                itemButtonClassName="rounded-[4px] px-2.5 py-1.5"
                itemLabelClassName="text-[11px] leading-[16px]"
              />
            </div>
          ) : (
            <div>
              <p className="mb-1 block select-none text-[11px] font-medium text-[#2a2f3a]">Department</p>
              <SingleSelectDropdown
                value={selectedDept}
                onChange={(value) => {
                  setTimeStudyDeptEditMode(value)
                  setToggledProgramsU([])
                  setToggledProgramsA([])
                  setToggledActivitiesU([])
                  setToggledActivitiesA([])
                  setSearchProgramsU("")
                  setSearchProgramsA("")
                  setSearchActivitiesU("")
                  setSearchActivitiesA("")
                  void programsQuery.refetch()
                  void activitiesQuery.refetch()
                }}
                onBlur={() => {}}
                options={departmentSelectOptionsFromMaster}
                placeholder={
                  masterDepartmentNames.length === 0 ? "No departments loaded" : "Select department"
                }
                isLoading={departmentsQuery.isPending || departmentsQuery.isFetching}
                contentClassName="max-h-[180px]"
                className="min-h-[46px] rounded-[7px] border-[#c6cedd] text-[11px] leading-[14px]"
                itemButtonClassName="rounded-[4px] px-2.5 py-1.5"
                itemLabelClassName="text-[11px] leading-[16px]"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <label className="select-none text-[11px] font-medium text-[#2a2f3a]">TS Minutes/Day</label>
          <div className="flex h-[46px] items-center rounded-[7px] border border-[#d2d8e3] bg-white px-3">
            <Input
              {...register("tsMinDay")}
              className="h-auto w-[70px] border-0 bg-transparent p-0 text-[12px] text-[#111827] shadow-none focus-visible:ring-0"
              placeholder="480"
            />
            <span className="ml-6 select-none text-[11px] text-[#2a2f3a]">Min/Day</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_60px_1fr] items-center gap-4">
        <TransferPanel
          title="Select TS Programs(Unassigned)"
          items={filteredProgramsU}
          selectedIds={toggledProgramsU}
          onToggleItem={(id) => setToggledProgramsU((prev) => toggleList(prev, id))}
          searchValue={searchProgramsU}
          onSearchChange={setSearchProgramsU}
          selectedDept={selectedDept}
        />

        <div className="flex flex-col gap-3 pt-10">
          <TransferListMoveButton
            direction="forward"
            onClick={() => void moveSelectedProgramsToAssignedColumn()}
            disabled={toggledProgramsU.length === 0 || tsTransferBusy || tsCatalogRefetchBusy}
            aria-label="Move selected programs to assigned"
          />
          <TransferListMoveButton
            direction="back"
            onClick={() => void moveSelectedProgramsToUnassignedColumn()}
            disabled={toggledProgramsA.length === 0 || tsTransferBusy || tsCatalogRefetchBusy}
            aria-label="Move selected programs to unassigned"
          />
        </div>

        <TransferPanel
          title="Select TS Programs(Assigned)"
          items={filteredProgramsA}
          selectedIds={toggledProgramsA}
          onToggleItem={(id) => setToggledProgramsA((prev) => toggleList(prev, id))}
          searchValue={searchProgramsA}
          onSearchChange={setSearchProgramsA}
          selectedDept={selectedDept}
        />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_60px_1fr] items-center gap-4">
        <TransferPanel
          title="Select Activities(Unassigned)"
          items={filteredActivitiesU}
          selectedIds={toggledActivitiesU}
          onToggleItem={(id) => setToggledActivitiesU((prev) => toggleList(prev, id))}
          searchValue={searchActivitiesU}
          onSearchChange={setSearchActivitiesU}
          selectedDept={selectedDept}
        />

        <div className="flex flex-col gap-3 pt-10">
          <TransferListMoveButton
            direction="forward"
            onClick={() => void moveSelectedActivitiesToAssignedColumn()}
            disabled={toggledActivitiesU.length === 0 || tsTransferBusy || tsCatalogRefetchBusy}
            aria-label="Move selected activities to assigned"
          />
          <TransferListMoveButton
            direction="back"
            onClick={() => void moveSelectedActivitiesToUnassignedColumn()}
            disabled={toggledActivitiesA.length === 0 || tsTransferBusy || tsCatalogRefetchBusy}
            aria-label="Move selected activities to unassigned"
          />
        </div>

        <TransferPanel
          title="Select Activities(Assigned)"
          items={filteredActivitiesA}
          selectedIds={toggledActivitiesA}
          onToggleItem={(id) => setToggledActivitiesA((prev) => toggleList(prev, id))}
          searchValue={searchActivitiesA}
          onSearchChange={setSearchActivitiesA}
          selectedDept={selectedDept}
        />
      </div>
    </div>
  )
}
