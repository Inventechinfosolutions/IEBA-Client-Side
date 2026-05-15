
import { lazy, Suspense, useMemo, useState } from "react"
import { ArrowLeft, ClipboardList, History } from "lucide-react"
import { useQueries } from "@tanstack/react-query"
import { useFormContext } from "react-hook-form"
import { toast } from "sonner"

import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"

import { addEmployeeTransferSuccessToastOptions } from "../schemas"
import type {
  AddEmployeeTimeStudyTransferItem,
  SecurityAssignedSnapshot,
  TimeStudyAssignmentsPanelProps,
  TimeStudyPlacementOverride,
  TimeStudyPlacementOverrideMap,
  UserModuleFormValues,
  UserProgramsActivitiesDepartmentBundle,
  UserProgramsActivitiesProgramWithAssignments,
} from "../types"

import {
  useAssignUserActivitiesTs,
  useAssignUserProgramsTs,
  useUnassignUserActivitiesTs,
  useUnassignUserProgramsTs,
} from "../mutations/time-study-program-activity-transfer"
import { apiUpdateUser } from "../../api"
import {
  useGetActivityDepartmentsForDepartment,
  useGetUserProgramsActivitiesDepartmentScope,
  useGetUserProgramsAndActivities,
} from "../queries/get-add-employee"
import { apiGetProgramActivityRelationActivities } from "@/features/program/api"
import { USER_ASSIGNMENT_HISTORY_KIND } from "@/features/program/queries/userProgramHistory"

import { TransferPanel } from "./transfer-panel"

const UserProgramHistoryTable = lazy(() =>
  import("@/features/program/components/UserProgramHistoryTable").then((m) => ({
    default: m.UserProgramHistoryTable,
  }))
)

const CountyActivityHistoryTable = lazy(() =>
  import("@/features/CountyActivityCode/components/CountyActivityHistoryTable").then((m) => ({
    default: m.CountyActivityHistoryTable,
  }))
)

type TsHistoryView = "program" | "activity"

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

type DepartmentSelectOption = { value: string; label: string }

function departmentSelectOptionsFromSnapshots(
  snapshots: ReadonlyArray<SecurityAssignedSnapshot>,
): DepartmentSelectOption[] {
  const map = new Map<string, DepartmentSelectOption>()
  for (const snap of snapshots) {
    if (snap.departmentId != null && snap.departmentId >= 1 && snap.department?.trim()) {
      map.set(String(snap.departmentId), {
        value: String(snap.departmentId),
        label: snap.department.trim(),
      })
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  )
}

function parsePositiveIntIds(ids: string[]): number[] {
  const out: number[] = []
  for (const s of ids) {
    const n = Number.parseInt(s, 10)
    if (Number.isFinite(n) && n >= 1) out.push(n)
  }
  return out
}

function isActiveActivityDepartmentStatus(status: string): boolean {
  return status.trim().toLowerCase() === "active"
}

function timeStudyPlacementOverrideKey(departmentName: string, rowId: string): string {
  return `${departmentName.trim()}::${rowId}`
}

function compareTransferItems(a: AddEmployeeTimeStudyTransferItem, b: AddEmployeeTimeStudyTransferItem): number {
  const getSortKey = (item: { code?: string; name: string }) => {
    const code = (item.code ?? "").trim()
    const name = item.name.trim()
    return code ? `(${code}) ${name}` : name
  }

  const pathA = [...(a.ancestors || []).map(getSortKey), getSortKey(a)]
  const pathB = [...(b.ancestors || []).map(getSortKey), getSortKey(b)]

  const minLen = Math.min(pathA.length, pathB.length)
  for (let i = 0; i < minLen; i++) {
    const cmp = pathA[i].localeCompare(pathB[i], undefined, { sensitivity: "base", numeric: true })
    if (cmp !== 0) return cmp
  }

  return pathA.length - pathB.length
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

function mapBundleProgramToTransferItem(
  program: UserProgramsActivitiesProgramWithAssignments,
  departmentName: string,
  allProgramsInDepartment: UserProgramsActivitiesProgramWithAssignments[],
): AddEmployeeTimeStudyTransferItem {
  const byId = new Map(allProgramsInDepartment.map((p) => [p.id, p]))
  const ancestors: { id: string; name: string; code?: string }[] = []
  let parentId = program.parentId ?? null
  let safety = 0
  while (parentId != null && byId.has(parentId) && safety < 10) {
    const parent = byId.get(parentId)!
    ancestors.unshift({ id: String(parent.id), name: parent.name, code: parent.code })
    parentId = parent.parentId ?? null
    safety++
  }
  return {
    id: String(program.id),
    department: departmentName,
    code: program.code,
    name: program.name,
    level: ancestors.length + 1,
    parentId: program.parentId != null ? String(program.parentId) : undefined,
    isMultiCode: program.isMultiCode,
    ancestors,
  }
}

function mapBundleProgramsToTransferItems(
  programs: UserProgramsActivitiesProgramWithAssignments[],
  departmentName: string,
  allProgramsInDepartment: UserProgramsActivitiesProgramWithAssignments[],
): AddEmployeeTimeStudyTransferItem[] {
  const dept = departmentName.trim()
  if (!dept) return []
  return sortTransferItems(
    programs.map((p) => mapBundleProgramToTransferItem(p, dept, allProgramsInDepartment)),
  )
}

function collectBundleActivityTransferItems(
  bundle: UserProgramsActivitiesDepartmentBundle,
): AddEmployeeTimeStudyTransferItem[] {
  const dept = bundle.departmentName.trim()
  if (!dept) return []
  const byId = new Map<string, AddEmployeeTimeStudyTransferItem>()
  for (const program of bundle.programs.assigned) {
    for (const activity of [...program.children.assigned, ...program.children.unassigned]) {
      const id = String(activity.id)
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          department: dept,
          code: activity.code,
          name: activity.name,
        })
      }
    }
  }
  return sortTransferItems([...byId.values()])
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

/** UI tab: Time Study Assignments */
export function TimeStudyAssignmentsPanel({
  mode,
  timeStudyContextUserId,
}: TimeStudyAssignmentsPanelProps) {
  const userIdForTs = (timeStudyContextUserId ?? "").trim()


  const hasUserTsBundle = Boolean(userIdForTs)
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

  const tsDepartmentScopeQuery = useGetUserProgramsActivitiesDepartmentScope(
    userIdForTs,
    hasUserTsBundle,
  )

  const { register, watch, setValue } = useFormContext<UserModuleFormValues>()
  const isAddMode = mode === "add"
  const employeeName = `${watch("firstName") ?? ""} ${watch("lastName") ?? ""}`.trim()
  const securityAssignedSnapshots = watch("securityAssignedSnapshots") ?? []


  /** Departments from GET …/programs-activities-with-assignments (scope, no departmentId). */
  const departmentSelectOptions = useMemo((): DepartmentSelectOption[] => {
    if (hasUserTsBundle) {
      return (tsDepartmentScopeQuery.data ?? [])
        .filter(
          (b) =>
            Number.isFinite(b.departmentId) &&
            b.departmentId >= 1 &&
            (b.departmentName ?? "").trim().length > 0,
        )
        .map((b) => ({
          value: String(b.departmentId),
          label: (b.departmentName ?? "").trim(),
        }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
    }
    return departmentSelectOptionsFromSnapshots(securityAssignedSnapshots)
  }, [hasUserTsBundle, tsDepartmentScopeQuery.data, securityAssignedSnapshots])

  const fetchProgramsPerDepartment = departmentSelectOptions.length > 1

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
  const [isSavingTsMinDay, setIsSavingTsMinDay] = useState(false)

  const [tsHistoryView, setTsHistoryView] = useState<TsHistoryView | null>(null)
  const [tsHistoryProgramSearch, setTsHistoryProgramSearch] = useState("")
  const [tsHistoryActivityCode, setTsHistoryActivityCode] = useState("")
  const [tsHistoryActivityName, setTsHistoryActivityName] = useState("")

  const canShowTsHistory = mode === "edit" && Boolean(userIdForTs)

  // Reset all local states when switching users or when a new user is created
  useMemo(() => {
    setAssignedProgramIdsAddMode([])
    setAssignedActivityIdsAddMode([])
    setProgramPlacementOverridesEditMode({})
    setActivityPlacementOverridesEditMode({})
    setToggledProgramsU([])
    setToggledProgramsA([])
    setToggledActivitiesU([])
    setToggledActivitiesA([])
    setTsHistoryView(null)
    setTsHistoryProgramSearch("")
    setTsHistoryActivityCode("")
    setTsHistoryActivityName("")
  }, [userIdForTs])

  const handleSaveTsMinDay = async () => {
    const userId = userIdForTs.trim()
    if (!userId) {
      toast.error("User ID is missing. Save employee details first.")
      return
    }

    const val = watch("tsMinDay")?.trim()
    const n = Number.parseInt(val ?? "", 10)
    if (val !== "" && (!Number.isFinite(n) || n < 0)) {
      toast.error("Please enter a valid number of minutes.")
      return
    }

    setIsSavingTsMinDay(true)
    try {
      await apiUpdateUser(userId, { tsMinPerDay: Number.isFinite(n) ? n : undefined })
      toast.success("TS Minutes/Day updated successfully.", addEmployeeTransferSuccessToastOptions)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update TS Minutes/Day")
    } finally {
      setIsSavingTsMinDay(false)
    }
  }

  /**
   * Add mode: Time Study department starts empty each visit (independent of Employee tab claiming unit)
   * until the user picks a department here; then we sync to `claimingUnit` for save/API.
   */
  const [timeStudyDeptAddMode, setTimeStudyDeptAddMode] = useState("")
  /** Edit: user override for department id (string); empty means “use API response default”. */
  const [timeStudyDeptEditMode, setTimeStudyDeptEditMode] = useState("")

  /**
   * One department → auto-select and use scope response for programs.
   * Multiple → user picks department; GET with `departmentId` loads programs.
   */
  const selectedEditDeptId = useMemo(() => {
    if (isAddMode) return ""
    const explicit = timeStudyDeptEditMode.trim()
    if (explicit) return explicit
    if (departmentSelectOptions.length === 1) return departmentSelectOptions[0].value
    return ""
  }, [isAddMode, timeStudyDeptEditMode, departmentSelectOptions])

  const selectedAddDeptId = useMemo(() => {
    if (!isAddMode) return ""
    const explicit = timeStudyDeptAddMode.trim()
    if (explicit) return explicit
    if (departmentSelectOptions.length === 1) return departmentSelectOptions[0].value
    return ""
  }, [isAddMode, timeStudyDeptAddMode, departmentSelectOptions])

  const activeDepartmentId = isAddMode ? selectedAddDeptId : selectedEditDeptId

  const programsDepartmentId = useMemo(() => {
    if (!hasUserTsBundle || departmentSelectOptions.length === 0) return null
    const pick =
      departmentSelectOptions.length === 1
        ? departmentSelectOptions[0].value
        : activeDepartmentId
    const n = Number.parseInt(pick, 10)
    return Number.isFinite(n) && n >= 1 ? n : null
  }, [hasUserTsBundle, departmentSelectOptions, activeDepartmentId])

  const userProgramsActivitiesQuery = useGetUserProgramsAndActivities(
    userIdForTs,
    programsDepartmentId,
    hasUserTsBundle && fetchProgramsPerDepartment && programsDepartmentId != null,
  )

  useMemo(() => {
    const programsReady = fetchProgramsPerDepartment
      ? userProgramsActivitiesQuery.isSuccess && !userProgramsActivitiesQuery.isFetching
      : tsDepartmentScopeQuery.isSuccess && !tsDepartmentScopeQuery.isFetching
    if (programsReady) {
      setProgramPlacementOverridesEditMode({})
      setActivityPlacementOverridesEditMode({})
    }
  }, [
    fetchProgramsPerDepartment,
    userProgramsActivitiesQuery.dataUpdatedAt,
    userProgramsActivitiesQuery.isFetching,
    userProgramsActivitiesQuery.isSuccess,
    tsDepartmentScopeQuery.dataUpdatedAt,
    tsDepartmentScopeQuery.isFetching,
    tsDepartmentScopeQuery.isSuccess,
  ])

  const selectedBundle = useMemo((): UserProgramsActivitiesDepartmentBundle | undefined => {
    if (!hasUserTsBundle || programsDepartmentId == null) return undefined
    if (fetchProgramsPerDepartment) {
      const list = userProgramsActivitiesQuery.data ?? []
      return (
        list.find((b) => b.departmentId === programsDepartmentId) ??
        list[0]
      )
    }
    return (tsDepartmentScopeQuery.data ?? []).find(
      (b) => b.departmentId === programsDepartmentId,
    )
  }, [
    hasUserTsBundle,
    programsDepartmentId,
    fetchProgramsPerDepartment,
    userProgramsActivitiesQuery.data,
    tsDepartmentScopeQuery.data,
  ])

  const needsDepartmentSelection =
    hasUserTsBundle && departmentSelectOptions.length > 1 && !activeDepartmentId

  const selectedDept = useMemo(() => {
    const fromBundle = selectedBundle?.departmentName.trim() ?? ""
    if (fromBundle) return fromBundle
    const raw = (isAddMode ? timeStudyDeptAddMode : activeDepartmentId).trim()
    if (!raw) return ""
    return departmentSelectOptions.find((o) => o.value === raw)?.label?.trim() ?? raw
  }, [isAddMode, timeStudyDeptAddMode, selectedBundle, activeDepartmentId, departmentSelectOptions])

  const selectedDepartmentNumericId = useMemo(() => {
    if (selectedBundle != null && Number.isFinite(selectedBundle.departmentId) && selectedBundle.departmentId >= 1) {
      return selectedBundle.departmentId
    }
    if (programsDepartmentId != null) return programsDepartmentId
    const n = Number.parseInt(activeDepartmentId.trim(), 10)
    return Number.isFinite(n) && n >= 1 ? n : null
  }, [selectedBundle, programsDepartmentId, activeDepartmentId])

  const allProgramsInSelectedBundle = useMemo(() => {
    if (!selectedBundle) return []
    return [...selectedBundle.programs.assigned, ...selectedBundle.programs.unassigned]
  }, [selectedBundle])

  const programCatalogForUserBundle = useMemo(() => {
    if (!selectedBundle) return []
    return mapBundleProgramsToTransferItems(
      allProgramsInSelectedBundle,
      selectedBundle.departmentName,
      allProgramsInSelectedBundle,
    )
  }, [selectedBundle, allProgramsInSelectedBundle])

  const bundleProgramIdsForSelectedDepartment = useMemo(
    () => new Set(selectedBundle?.programs.assigned.map((p) => String(p.id)) ?? []),
    [selectedBundle],
  )

  const bundleActivityIdsForSelectedDepartment = useMemo(() => {
    const ids = new Set<string>()
    for (const program of selectedBundle?.programs.assigned ?? []) {
      for (const activity of program.children.assigned) {
        ids.add(String(activity.id))
      }
    }
    return ids
  }, [selectedBundle])

  const activityCatalogForUserBundle = useMemo(
    () => (selectedBundle ? collectBundleActivityTransferItems(selectedBundle) : []),
    [selectedBundle],
  )

  const globalProgramsForSelectedDepartment = useMemo(
    () => filterTransferItemsByDepartment(programCatalogForUserBundle, selectedDept),
    [programCatalogForUserBundle, selectedDept],
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
    () => filterTransferItemsByDepartment(programCatalogForUserBundle, selectedDept),
    [programCatalogForUserBundle, selectedDept],
  )

  const programsUnassigned = useMemo(() => {
    if (hasUserTsBundle) {
      return buildUnassignedItemsForEditMode(
        globalProgramsForSelectedDepartment,
        programAssignedPredicateEditMode,
      )
    }
    return deptProgramsAddMode.filter((p) => !assignedProgramIdsAddMode.includes(p.id))
  }, [
    hasUserTsBundle,
    globalProgramsForSelectedDepartment,
    programAssignedPredicateEditMode,
    deptProgramsAddMode,
    assignedProgramIdsAddMode,
  ])

  const programsAssigned = useMemo(() => {
    if (hasUserTsBundle) {
      return buildAssignedItemsForEditMode(
        globalProgramsForSelectedDepartment,
        [],
        programAssignedPredicateEditMode,
      )
    }
    return deptProgramsAddMode.filter((p) => assignedProgramIdsAddMode.includes(p.id))
  }, [
    hasUserTsBundle,
    globalProgramsForSelectedDepartment,
    programAssignedPredicateEditMode,
    deptProgramsAddMode,
    assignedProgramIdsAddMode,
  ])

  /**
   * Activities are only fetched once at least one program is assigned.
   * This enforces the Department → Program → Activities dependency chain
   * without useEffect: the query is simply disabled until programsAssigned is non-empty.
   */
  const activityDepartmentsQuery = useGetActivityDepartmentsForDepartment(
    selectedDepartmentNumericId,
    !hasUserTsBundle && selectedDepartmentNumericId != null && programsAssigned.length > 0,
  )

  /**
   * For each assigned program, fetch its activities in parallel (no useEffect).
   * The endpoint returns which Activity master IDs are assigned to each program.
   * We cross-reference these with activityDepartmentsQuery (which has ActivityDepartment IDs
   * needed for POST /users/new/assign/activity) via row.activityId.
   */
  const programActivityQueryResults = useQueries({
    queries: programsAssigned.map((program) => ({
      queryKey: ["programActivityRelation", "activities", selectedDepartmentNumericId, program.id],
      enabled: !hasUserTsBundle && selectedDepartmentNumericId != null,
      queryFn: () =>
        apiGetProgramActivityRelationActivities(
          selectedDepartmentNumericId!,
          Number(program.id),
        ),
      staleTime: 0,
    })),
  })

  /**
   * Collect the set of master Activity IDs that are assigned to any of the user's programs.
   * These come from the last segment of each node's tree key (e.g. "dept-1-act-5" → "5").
   */
  const { programAssignedActivityIds, activityLevels } = useMemo(() => {
    const ids = new Set<string>()
    const levels = new Map<string, number>()

    const traverse = (nodes: any[], currentLevel: number) => {
      for (const node of nodes) {
        const id = String(String(node.key ?? "").split("-").at(-1) ?? "")
        if (id) {
          ids.add(id)
          levels.set(id, Math.max(levels.get(id) || 0, currentLevel))
        }
        if (Array.isArray(node.children)) {
          traverse(node.children, currentLevel + 1)
        }
      }
    }

    for (const result of programActivityQueryResults) {
      if (!result.data) continue
      const roots = result.data.assignedActivities
      if (!Array.isArray(roots) || roots.length === 0) continue
      const activityNode = roots[0]?.activity?.[0]
      const children = Array.isArray(activityNode?.children) ? activityNode.children : []
      traverse(children, 0)
    }
    return { programAssignedActivityIds: ids, activityLevels: levels }
  }, [programActivityQueryResults])

  /** ActivityDepartment link ids per selected department (not master GET /activities ids). */
  const globalActivityCatalogFromDepartments = useMemo<AddEmployeeTimeStudyTransferItem[]>(() => {
    const deptLabel = selectedDept.trim()
    if (!deptLabel) return []
    const rows = activityDepartmentsQuery.data ?? []
    const filtered =
      programsAssigned.length > 0 && programAssignedActivityIds.size > 0
        ? rows.filter((a) => isActiveActivityDepartmentStatus(a.status) && programAssignedActivityIds.has(String(a.id)))
        : []
    return filtered.map((a) => ({
      id: String(a.id),
      department: deptLabel,
      code: a.code,
      name: a.name,
      level: activityLevels.get(String(a.id)) || 0,
    }))
  }, [activityDepartmentsQuery.data, selectedDept, programsAssigned, programAssignedActivityIds, activityLevels])

  const globalActivitiesForSelectedDepartment = useMemo(() => {
    if (hasUserTsBundle) {
      return filterTransferItemsByDepartment(activityCatalogForUserBundle, selectedDept)
    }
    return filterTransferItemsByDepartment(globalActivityCatalogFromDepartments, selectedDept)
  }, [hasUserTsBundle, activityCatalogForUserBundle, globalActivityCatalogFromDepartments, selectedDept])

  const deptActivitiesAddMode = useMemo(() => {
    if (!selectedDept) return []
    return globalActivitiesForSelectedDepartment
  }, [globalActivitiesForSelectedDepartment, selectedDept])

  const tsCatalogRefetchBusy =
    hasUserTsBundle &&
    (tsDepartmentScopeQuery.isFetching ||
      (fetchProgramsPerDepartment && userProgramsActivitiesQuery.isFetching) ||
      (Boolean(activeDepartmentId) && activityDepartmentsQuery.isFetching))

  const addModeDepartmentDropdownLoading =
    hasUserTsBundle && (tsDepartmentScopeQuery.isPending || tsDepartmentScopeQuery.isFetching)
  const editModeDepartmentDropdownLoading =
    tsDepartmentScopeQuery.isPending || tsDepartmentScopeQuery.isFetching

  const activitiesUnassigned = useMemo(() => {
    if (hasUserTsBundle) {
      return buildUnassignedItemsForEditMode(
        globalActivitiesForSelectedDepartment,
        activityAssignedPredicateEditMode,
      )
    }
    return deptActivitiesAddMode.filter((a) => !assignedActivityIdsAddMode.includes(a.id))
  }, [
    hasUserTsBundle,
    globalActivitiesForSelectedDepartment,
    activityAssignedPredicateEditMode,
    deptActivitiesAddMode,
    assignedActivityIdsAddMode,
  ])

  const activitiesAssigned = useMemo(() => {
    if (hasUserTsBundle) {
      return buildAssignedItemsForEditMode(
        globalActivitiesForSelectedDepartment,
        [],
        activityAssignedPredicateEditMode,
      )
    }
    return deptActivitiesAddMode.filter((a) => assignedActivityIdsAddMode.includes(a.id))
  }, [
    hasUserTsBundle,
    globalActivitiesForSelectedDepartment,
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
        toast.success("Programs assigned.", addEmployeeTransferSuccessToastOptions)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to assign programs")
        return
      }
    }

    if (hasUserTsBundle) {
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
        toast.success("Programs unassigned.", addEmployeeTransferSuccessToastOptions)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to unassign programs")
        return
      }
    }

    if (hasUserTsBundle) {
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
      if (selectedDepartmentNumericId == null) {
        toast.error("Select a department before assigning activities.")
        return
      }
      try {
        await assignActivitiesMutation.mutateAsync({
          userId: userIdForTs,
          departmentId: selectedDepartmentNumericId,
          countyActivity: activityIds,
        })
        toast.success("Activities assigned.", addEmployeeTransferSuccessToastOptions)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to assign activities")
        return
      }
    }

    if (hasUserTsBundle) {
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
      if (selectedDepartmentNumericId == null) {
        toast.error("Select a department before unassigning activities.")
        return
      }
      try {
        await unassignActivitiesMutation.mutateAsync({
          userId: userIdForTs,
          departmentId: selectedDepartmentNumericId,
          countyActivity: activityIds,
        })
        toast.success("Activities unassigned.", addEmployeeTransferSuccessToastOptions)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to unassign activities")
        return
      }
    }

    if (hasUserTsBundle) {
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

  const toggleAllProgramsU = () => {
    const allSelected = filteredProgramsU.length > 0 && filteredProgramsU.every((p) => toggledProgramsU.includes(p.id))
    if (allSelected) {
      const filteredIds = new Set(filteredProgramsU.map((p) => p.id))
      setToggledProgramsU((prev) => prev.filter((id) => !filteredIds.has(id)))
    } else {
      setToggledProgramsU((prev) => Array.from(new Set([...prev, ...filteredProgramsU.map((p) => p.id)])))
    }
  }
  const toggleAllProgramsA = () => {
    const allSelected = filteredProgramsA.length > 0 && filteredProgramsA.every((p) => toggledProgramsA.includes(p.id))
    if (allSelected) {
      const filteredIds = new Set(filteredProgramsA.map((p) => p.id))
      setToggledProgramsA((prev) => prev.filter((id) => !filteredIds.has(id)))
    } else {
      setToggledProgramsA((prev) => Array.from(new Set([...prev, ...filteredProgramsA.map((p) => p.id)])))
    }
  }
  const toggleAllActivitiesU = () => {
    const allSelected = filteredActivitiesU.length > 0 && filteredActivitiesU.every((a) => toggledActivitiesU.includes(a.id))
    if (allSelected) {
      const filteredIds = new Set(filteredActivitiesU.map((a) => a.id))
      setToggledActivitiesU((prev) => prev.filter((id) => !filteredIds.has(id)))
    } else {
      setToggledActivitiesU((prev) => Array.from(new Set([...prev, ...filteredActivitiesU.map((a) => a.id)])))
    }
  }
  const toggleAllActivitiesA = () => {
    const allSelected = filteredActivitiesA.length > 0 && filteredActivitiesA.every((a) => toggledActivitiesA.includes(a.id))
    if (allSelected) {
      const filteredIds = new Set(filteredActivitiesA.map((a) => a.id))
      setToggledActivitiesA((prev) => prev.filter((id) => !filteredIds.has(id)))
    } else {
      setToggledActivitiesA((prev) => Array.from(new Set([...prev, ...filteredActivitiesA.map((a) => a.id)])))
    }
  }

  return (
    <div className="relative min-w-0 pt-2">
      {(tsCatalogRefetchBusy || tsTransferBusy) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[8px] bg-white/60">
          <Spinner className="text-[#6C5DD3]" />
        </div>
      )}
      <p className="mb-4 select-none text-[12px] font-semibold uppercase text-[#111827]">
        {employeeName}
      </p>

      {hasUserTsBundle &&
      (tsDepartmentScopeQuery.isError || userProgramsActivitiesQuery.isError) ? (
        <p className="mb-3 text-[11px] text-red-500" role="alert">
          {(tsDepartmentScopeQuery.error ?? userProgramsActivitiesQuery.error) instanceof Error
            ? (tsDepartmentScopeQuery.error ?? userProgramsActivitiesQuery.error)!.message
            : "Failed to load time study programs and activities for this user"}
        </p>
      ) : null}

      {needsDepartmentSelection ? (
        <p className="mb-3 text-[11px] text-[#6b7280]" role="status">
          Select a department to load time study programs and activities for that department.
        </p>
      ) : null}

      {tsHistoryView != null ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              className="h-9 cursor-pointer gap-2 rounded-[12px] border border-[#E5E7EB] bg-white px-3 text-[12px] font-semibold text-[#6C5DD3] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:border-[#6C5DD3] hover:bg-[#F3F0FF]"
              onClick={() => {
                setTsHistoryView(null)
                setTsHistoryProgramSearch("")
                setTsHistoryActivityCode("")
                setTsHistoryActivityName("")
              }}
            >
              <ArrowLeft className="size-3.5" />
              Back to assignments
            </Button>
            {tsHistoryView === "program" ? (
              <TitleCaseInput
                value={tsHistoryProgramSearch}
                onChange={(e) => setTsHistoryProgramSearch(e.target.value)}
                placeholder="Search Program Code"
                className="h-[41px] w-[270px] rounded-[10px] border border-[#d0d5df] bg-white px-3.5 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
              />
            ) : (
              <>
                <TitleCaseInput
                  value={tsHistoryActivityCode}
                  onChange={(e) => setTsHistoryActivityCode(e.target.value)}
                  placeholder="Search Activity Code"
                  className="h-[41px] w-[220px] rounded-[10px] border border-[#d0d5df] bg-white px-3.5 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
                />
                <TitleCaseInput
                  value={tsHistoryActivityName}
                  onChange={(e) => setTsHistoryActivityName(e.target.value)}
                  placeholder="Search Activity Name"
                  className="h-[41px] w-[250px] rounded-[10px] border border-[#d0d5df] bg-white px-3.5 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
                />
              </>
            )}
          </div>
          <Suspense
            fallback={
              <div className="relative flex min-h-[240px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white">
                <Spinner className="text-[#6C5DD3]" />
              </div>
            }
          >
            {tsHistoryView === "program" ? (
              <UserProgramHistoryTable
                userId={userIdForTs}
                programCode={tsHistoryProgramSearch}
                historyKind={USER_ASSIGNMENT_HISTORY_KIND}
              />
            ) : (
              <CountyActivityHistoryTable
                countyActivityCode={tsHistoryActivityCode}
                countyActivityName={tsHistoryActivityName}
                userId={userIdForTs}
                historyKind={USER_ASSIGNMENT_HISTORY_KIND}
                columnLayout="assignment"
              />
            )}
          </Suspense>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <div className="w-full max-w-[306px] shrink-0">
              {isAddMode ? (
                <div>
                  <p className="mb-1 block select-none text-[11px] font-medium text-[#2a2f3a]">Department</p>
                  <SingleSelectDropdown
                    value={selectedAddDeptId}
                    onChange={(value) => {
                      const deptLabel =
                        departmentSelectOptions.find((o) => o.value === value)?.label?.trim() ?? value
                      setTimeStudyDeptAddMode(value)
                      setProgramPlacementOverridesEditMode({})
                      setActivityPlacementOverridesEditMode({})
                      setToggledProgramsU([])
                      setToggledProgramsA([])
                      setToggledActivitiesU([])
                      setToggledActivitiesA([])
                      setSearchProgramsU("")
                      setSearchProgramsA("")
                      setSearchActivitiesU("")
                      setSearchActivitiesA("")
                      setValue("claimingUnit", deptLabel, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }}
                    onBlur={() => {}}
                    options={departmentSelectOptions}
                    placeholder={
                      departmentSelectOptions.length === 0
                        ? "No assigned departments"
                        : "Select department"
                    }
                    isLoading={addModeDepartmentDropdownLoading}
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
                    value={selectedEditDeptId}
                    onChange={(value) => {
                      setTimeStudyDeptEditMode(value)
                      setProgramPlacementOverridesEditMode({})
                      setActivityPlacementOverridesEditMode({})
                      setToggledProgramsU([])
                      setToggledProgramsA([])
                      setToggledActivitiesU([])
                      setToggledActivitiesA([])
                      setSearchProgramsU("")
                      setSearchProgramsA("")
                      setSearchActivitiesU("")
                      setSearchActivitiesA("")
                    }}
                    onBlur={() => {}}
                    options={departmentSelectOptions}
                    placeholder={
                      departmentSelectOptions.length === 0
                        ? "No assigned departments"
                        : "Select department"
                    }
                    isLoading={editModeDepartmentDropdownLoading}
                    contentClassName="max-h-[180px]"
                    className="min-h-[46px] rounded-[7px] border-[#c6cedd] text-[11px] leading-[14px]"
                    itemButtonClassName="rounded-[4px] px-2.5 py-1.5"
                    itemLabelClassName="text-[11px] leading-[16px]"
                  />
                </div>
              )}
            </div>

            <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-4 sm:gap-y-3 lg:flex-1 lg:justify-end">
              <div className="flex w-full shrink-0 flex-col gap-1 sm:w-auto">
                <label className="select-none text-[11px] font-medium text-[#2a2f3a]">TS Minutes/Day</label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-[46px] items-center rounded-[7px] border border-[#d2d8e3] bg-white px-3">
                    <TitleCaseInput
                      {...register("tsMinDay")}
                      className="h-auto w-[70px] border-0 bg-transparent p-0 text-[12px] text-[#111827] shadow-none focus-visible:ring-0"
                    />
                    <span className="ml-6 select-none text-[11px] text-[#2a2f3a]">Min/Day</span>
                  </div>
                  <Button
                    type="button"
                    onClick={handleSaveTsMinDay}
                    disabled={!canPersistTsTransfers || isSavingTsMinDay}
                    className="h-[46px] rounded-[7px] bg-[#6C5DD3] px-5 text-[12px] font-medium text-white hover:bg-[#6C5DD3] disabled:opacity-50"
                  >
                    {isSavingTsMinDay ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
              {canShowTsHistory ? (
                <div className="flex w-full min-w-0 flex-wrap content-end gap-2 sm:w-auto sm:max-w-full sm:justify-end">
                  <Button
                    type="button"
                    className="inline-flex h-auto min-h-9 shrink cursor-pointer items-start gap-2 whitespace-normal rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-2 text-left text-[11px] font-semibold leading-snug text-[#6C5DD3] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:border-[#6C5DD3] hover:bg-[#F3F0FF] sm:text-[12px]"
                    onClick={() => setTsHistoryView("program")}
                  >
                    <History className="mt-0.5 size-3.5 shrink-0" />
                    <span>User Program History</span>
                  </Button>
                  <Button
                    type="button"
                    className="inline-flex h-auto min-h-9 shrink cursor-pointer items-start gap-2 whitespace-normal rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-2 text-left text-[11px] font-semibold leading-snug text-[#6C5DD3] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:border-[#6C5DD3] hover:bg-[#F3F0FF] sm:text-[12px]"
                    onClick={() => setTsHistoryView("activity")}
                  >
                    <ClipboardList className="mt-0.5 size-3.5 shrink-0" />
                    <span>User Activity History</span>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[1fr_60px_1fr] items-center gap-4">
            <TransferPanel
              title="Select TS Programs(Unassigned)"
              items={filteredProgramsU}
              selectedIds={toggledProgramsU}
              onToggleItem={(id) => setToggledProgramsU((prev) => toggleList(prev, id))}
              onToggleAll={toggleAllProgramsU}
              searchValue={searchProgramsU}
              onSearchChange={setSearchProgramsU}
              selectedDept={selectedDept}
            />

            <div className="flex flex-col gap-3 pt-10">
              <TransferListMoveButton
                direction="forward"
                onClick={() => void moveSelectedProgramsToAssignedColumn()}
                disabled={
                  toggledProgramsU.length === 0 ||
                  tsTransferBusy ||
                  tsCatalogRefetchBusy ||
                  needsDepartmentSelection
                }
                aria-label="Move selected programs to assigned"
              />
              <TransferListMoveButton
                direction="back"
                onClick={() => void moveSelectedProgramsToUnassignedColumn()}
                disabled={
                  toggledProgramsA.length === 0 ||
                  tsTransferBusy ||
                  tsCatalogRefetchBusy ||
                  needsDepartmentSelection
                }
                aria-label="Move selected programs to unassigned"
              />
            </div>

            <TransferPanel
              title="Select TS Programs(Assigned)"
              items={filteredProgramsA}
              selectedIds={toggledProgramsA}
              onToggleItem={(id) => setToggledProgramsA((prev) => toggleList(prev, id))}
              onToggleAll={toggleAllProgramsA}
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
              onToggleAll={toggleAllActivitiesU}
              searchValue={searchActivitiesU}
              onSearchChange={setSearchActivitiesU}
              selectedDept={selectedDept}
            />

            <div className="flex flex-col gap-3 pt-10">
              <TransferListMoveButton
                direction="forward"
                onClick={() => void moveSelectedActivitiesToAssignedColumn()}
                disabled={
                  toggledActivitiesU.length === 0 ||
                  tsTransferBusy ||
                  tsCatalogRefetchBusy ||
                  needsDepartmentSelection
                }
                aria-label="Move selected activities to assigned"
              />
              <TransferListMoveButton
                direction="back"
                onClick={() => void moveSelectedActivitiesToUnassignedColumn()}
                disabled={
                  toggledActivitiesA.length === 0 ||
                  tsTransferBusy ||
                  tsCatalogRefetchBusy ||
                  needsDepartmentSelection
                }
                aria-label="Move selected activities to unassigned"
              />
            </div>

            <TransferPanel
              title="Select Activities(Assigned)"
              items={filteredActivitiesA}
              selectedIds={toggledActivitiesA}
              onToggleItem={(id) => setToggledActivitiesA((prev) => toggleList(prev, id))}
              onToggleAll={toggleAllActivitiesA}
              searchValue={searchActivitiesA}
              onSearchChange={setSearchActivitiesA}
              selectedDept={selectedDept}
            />
          </div>
        </>
      )}
    </div>
  )
}
