
import { useMemo, useState } from "react"
import { useFormContext } from "react-hook-form"
import { toast } from "sonner"

import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { Button } from "@/components/ui/button"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"

import { addEmployeeTransferSuccessToastOptions } from "../schemas"
import type {
  AddEmployeeDepartmentOption,
  AddEmployeeTimeStudyTransferItem,
  TimeStudyAssignmentsPanelProps,
  TimeStudyPlacementOverride,
  TimeStudyPlacementOverrideMap,
  UserModuleFormValues,
  UserProgramsActivitiesDepartmentBundle,
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
  useGetAddEmployeeDepartments,
  useGetAddEmployeeTimeStudyPrograms,
  useGetUserProgramsAndActivities,
} from "../queries/get-add-employee"

import { TransferPanel } from "./transfer-panel"

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

function isActiveActivityDepartmentStatus(status: string): boolean {
  return status.trim().toLowerCase() === "active"
}

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
  const userProgramsActivitiesQuery = useGetUserProgramsAndActivities(userIdForTs, isEditTimeStudyWithUserBundle)

  const { register, watch, setValue } = useFormContext<UserModuleFormValues>()
  const isAddMode = mode === "add"
  const employeeName = `${watch("firstName") ?? ""} ${watch("lastName") ?? ""}`.trim()
  const securityAssignedSnapshots = watch("securityAssignedSnapshots") ?? []


  const departmentSelectOptionsFromMaster = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>()
    for (const snap of securityAssignedSnapshots) {
      if (snap.department && snap.department.trim()) {
        const dName = snap.department.trim()
        map.set(dName, { value: dName, label: dName })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
  }, [securityAssignedSnapshots])

  /** Edit mode: departments from GET …/user/programs-activities when the user has TS assignments. */
  const departmentSelectOptionsFromUserBundle = useMemo(() => {
    const bundles = userProgramsActivitiesQuery.data ?? []
    return bundles
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
  }, [userProgramsActivitiesQuery.data])

  /**
   * Edit mode filters by departments assigned in the Security panel.
   */
  const departmentSelectOptionsForEditMode = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>()
    for (const snap of securityAssignedSnapshots) {
      if (snap.departmentId && snap.department) {
        map.set(String(snap.departmentId), {
          value: String(snap.departmentId),
          label: snap.department.trim(),
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
  }, [securityAssignedSnapshots])

  const globalProgramCatalog = useMemo<AddEmployeeTimeStudyTransferItem[]>(() => {
    const rows = programsQuery.data ?? []
    return rows.map((p) => ({
      id: p.id,
      department: p.department,
      code: p.code,
      name: p.name,
    }))
  }, [programsQuery.data])

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
   * Edit mode: explicit dropdown choice, or the first valid `departmentId` from GET …/user/programs-activities
   * (response order) so the dropdown and lists initialize from the API without useEffect.
   */
  const selectedEditDeptId = useMemo(() => {
    if (isAddMode) return ""
    const explicit = timeStudyDeptEditMode.trim()
    if (explicit) return explicit
    const bundles = userProgramsActivitiesQuery.data ?? []
    for (const b of bundles) {
      if (
        Number.isFinite(b.departmentId) &&
        b.departmentId >= 1 &&
        (b.departmentName ?? "").trim().length > 0
      ) {
        return String(b.departmentId)
      }
    }
    return ""
  }, [isAddMode, timeStudyDeptEditMode, userProgramsActivitiesQuery.data])

  const selectedBundle = useMemo((): UserProgramsActivitiesDepartmentBundle | undefined => {
    if (!selectedEditDeptId) return undefined
    return (userProgramsActivitiesQuery.data ?? []).find(
      (b) => String(b.departmentId) === selectedEditDeptId,
    )
  }, [userProgramsActivitiesQuery.data, selectedEditDeptId])

  const selectedDept = useMemo(() => {
    if (isAddMode) return timeStudyDeptAddMode.trim()
    const fromBundle = selectedBundle?.departmentName.trim() ?? ""
    if (fromBundle) return fromBundle
    const idStr = selectedEditDeptId.trim()
    if (!idStr) return ""
    for (const d of departmentsQuery.data ?? []) {
      const n = parseDepartmentNumericId(d)
      if (n != null && String(n) === idStr) {
        return d.name.trim()
      }
    }
    return ""
  }, [isAddMode, timeStudyDeptAddMode, selectedBundle, selectedEditDeptId, departmentsQuery.data])

  const selectedDepartmentNumericId = useMemo(() => {
    if (isAddMode) {
      return departmentIdByClaimingUnitName(departmentsQuery.data, timeStudyDeptAddMode.trim())
    }
    if (selectedBundle != null && Number.isFinite(selectedBundle.departmentId) && selectedBundle.departmentId >= 1) {
      return selectedBundle.departmentId
    }
    const n = Number.parseInt(selectedEditDeptId.trim(), 10)
    if (Number.isFinite(n) && n >= 1) return n
    return null
  }, [isAddMode, departmentsQuery.data, timeStudyDeptAddMode, selectedBundle, selectedEditDeptId])

  const activityDepartmentsQuery = useGetActivityDepartmentsForDepartment(
    selectedDepartmentNumericId,
    selectedDepartmentNumericId != null,
  )

  /** Edit: after department change, block transfers until program list + department-scoped activities finish loading. */
  const tsCatalogRefetchBusy =
    isEditTimeStudyWithUserBundle &&
    (programsQuery.isFetching || activityDepartmentsQuery.isFetching)

  const addModeDepartmentDropdownLoading = departmentsQuery.isPending || departmentsQuery.isFetching
  const editModeDepartmentDropdownLoading =
    userProgramsActivitiesQuery.isPending ||
    userProgramsActivitiesQuery.isFetching ||
    (departmentSelectOptionsFromUserBundle.length === 0 &&
      (departmentsQuery.isPending || departmentsQuery.isFetching))

  /** ActivityDepartment link ids per selected department (not master GET /activities ids). */
  const globalActivityCatalog = useMemo<AddEmployeeTimeStudyTransferItem[]>(() => {
    const deptLabel = selectedDept.trim()
    if (!deptLabel) return []
    const rows = activityDepartmentsQuery.data ?? []
    return rows
      .filter((a) => isActiveActivityDepartmentStatus(a.status))
      .map((a) => ({
        id: String(a.id),
        department: deptLabel,
        code: a.code,
        name: a.name,
      }))
  }, [activityDepartmentsQuery.data, selectedDept])

  const programCatalogForAddMode = globalProgramCatalog
  const activityCatalogForAddMode = globalActivityCatalog

  const bundleProgramsForSelectedDepartment = useMemo(() => {
    if (!selectedBundle) return []
    const dept = selectedBundle.departmentName.trim()
    return selectedBundle.programs.map((p) => ({
      id: String(p.id),
      code: p.code,
      name: p.name,
      department: dept,
    }))
  }, [selectedBundle])

  const bundleActivitiesForSelectedDepartment = useMemo(() => {
    if (!selectedBundle) return []
    const dept = selectedBundle.departmentName.trim()
    return selectedBundle.activities.map((a) => ({
      id: String(a.id),
      code: a.code,
      name: a.name,
      department: dept,
    }))
  }, [selectedBundle])

  const bundleProgramIdsForSelectedDepartment = useMemo(
    () => new Set(bundleProgramsForSelectedDepartment.map((p) => p.id)),
    [bundleProgramsForSelectedDepartment],
  )

  const bundleActivityIdsForSelectedDepartment = useMemo(
    () => new Set(bundleActivitiesForSelectedDepartment.map((a) => a.id)),
    [bundleActivitiesForSelectedDepartment],
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
        toast.success("Programs assigned.", addEmployeeTransferSuccessToastOptions)
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
        toast.success("Programs unassigned.", addEmployeeTransferSuccessToastOptions)
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
                  departmentSelectOptionsFromMaster.length === 0 ? "No assigned departments" : "Select department"
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
                  setToggledProgramsU([])
                  setToggledProgramsA([])
                  setToggledActivitiesU([])
                  setToggledActivitiesA([])
                  setSearchProgramsU("")
                  setSearchProgramsA("")
                  setSearchActivitiesU("")
                  setSearchActivitiesA("")
                  void programsQuery.refetch()
                }}
                onBlur={() => {}}
                options={departmentSelectOptionsForEditMode}
                placeholder={
                  departmentSelectOptionsForEditMode.length === 0
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

        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <label className="select-none text-[11px] font-medium text-[#2a2f3a]">TS Minutes/Day</label>
            <div className="flex items-center gap-3">
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
