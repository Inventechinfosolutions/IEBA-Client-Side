import { lazy, Suspense, useCallback, useMemo, useRef, useState, useLayoutEffect } from "react"
import { Spinner } from "@/components/ui/spinner"
import { Controller, useFormContext, useFieldArray } from "react-hook-form"
import { toast } from "sonner"

import { ArrowLeft, History, Trash2, Plus } from "lucide-react"
import { queryClient } from "@/main"
import { fetchSecurityDepartmentRoles, fetchUserDetailsTab } from "../api"
import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { usePermissions } from "@/hooks/usePermissions"

import type {
  AddEmployeeSecurityRoleItem,
  SecurityAssignmentsPanelProps,
  UserModuleFormValues,
  UserTimeStudyDepartment,
} from "../types"

import { addEmployeeTransferSuccessToastOptions } from "../schemas"
import { useAssignUserDepartmentRoles, useUnassignUserDepartmentRoles } from "../mutations/user-department-role-transfer"
import { useGetAllDepartments } from "@/features/department/queries/getDepartments"
import { addEmployeeLookupKeys } from "../keys"
import {
  useGetSecurityDepartmentRoles,
  useGetUserDetailsTab,
  useGetUserAllowMulticodeHistory,
  useGetUserTimeStudyDepartments,
} from "../queries/get-add-employee"
import {
  MultiSelectDropdown,
  parseMultiSelectStoredValues,
} from "@/components/ui/multi-select-dropdown"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarDays } from "lucide-react"
import { securityRoleItemsFromSnapshots } from "../utility/parseSecurityDepartmentRoles"
import { syncSecurityAssignmentsForm } from "../utility/syncSecurityAssignmentsForm"
import {
  apportioningFieldsFromTab2,
  parseUserDetailsTab2,
  syncSecurityTab2Form,
} from "../utility/syncSecurityTab2Form"
import {
  buildUserDepartmentRoleDepartmentsPayload,
  departmentIdFromSecurityCatalogItemId,
  roleRefIdFromSecurityCatalogItemId,
} from "../utility/buildUserDepartmentRoleDepartmentsPayload"
import statusCheck from "@/assets/status-check.png"
import statusCross from "@/assets/status-cross.png"
import { RoleTransferPanel } from "./role-transfer-panel"
import { DEPARTMENT_ROLE_USER_ASSIGNMENT_HISTORY_KIND } from "@/features/DepartmentRole/queries/departmentRoleHistory"

const DepartmentRoleHistoryTable = lazy(() =>
  import("@/features/DepartmentRole/components/DepartmentRoleHistoryTable").then((m) => ({
    default: m.DepartmentRoleHistoryTable,
  }))
)

function normalizeDeptRolePart(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ")
}

/** Match assigned row from user details to catalog row (department + role name). */
function departmentRolePairKey(department: string, roleName: string): string {
  return `${normalizeDeptRolePart(department)}|${normalizeDeptRolePart(roleName)}`
}

function normalizeRoleId(role: string): string {
  return role.trim().toLowerCase().replace(/\s+/g, "-")
}

function toIsoYmd(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function displayDate(val: string): string {
  if (!val) return "";
  const normalized = val.includes("T") ? val.split("T")[0] : val
  const parts = normalized.split("-");
  if (parts.length !== 3) return val;
  return `${parts[1]}-${parts[2]}-${parts[0]}`; // MM-DD-YYYY
}

function toDateInputValue(val: string | null | undefined): string {
  const raw = String(val ?? "").trim()
  if (!raw) return ""
  return raw.includes("T") ? raw.split("T")[0] : raw
}

const ACTIVATION_END_BEFORE_START_MSG =
  "Activation end date cannot be before the activation start date."

function isActivationEndBeforeStart(
  startDate: string | undefined,
  endDate: string | undefined,
): boolean {
  const start = toDateInputValue(startDate)
  const end = toDateInputValue(endDate)
  if (!start || !end) return false
  return end < start
}

function parseDeptMultiCodesList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((c) => String(c).trim()).filter(Boolean)
  }
  if (typeof raw === "string") {
    return raw.split(",").map((s) => s.trim()).filter(Boolean)
  }
  return []
}

type DeptSettingsLike = {
  allowMultiCodes?: boolean
  multiCodes?: unknown
  allowActivationStartDateAndEndDate?: boolean
}

/** User departments API wins when present; fall back to /departments/all only if that row is missing. */
function departmentMultiCodeSupportFromApi(
  userDept: UserTimeStudyDepartment | undefined,
  globalSettings: DeptSettingsLike | undefined,
): { allowedCodes: string[]; multiCodeNotAvailable: boolean } {
  if (userDept != null) {
    const codes = parseDeptMultiCodesList(userDept.multiCodes ?? [])
    return {
      allowedCodes: codes,
      // Dept is on the user list but has no configured codes — cannot enable multi-codes.
      multiCodeNotAvailable: codes.length === 0,
    }
  }
  if (globalSettings?.allowMultiCodes === false) {
    return { allowedCodes: [], multiCodeNotAvailable: true }
  }
  const globalCodes = parseDeptMultiCodesList(globalSettings?.multiCodes)
  if (globalSettings?.allowMultiCodes === true && globalCodes.length > 0) {
    return { allowedCodes: globalCodes, multiCodeNotAvailable: false }
  }
  // Dept not in user API yet (e.g. just assigned) — do not block the Allow MultiCodes toggle.
  return { allowedCodes: [], multiCodeNotAvailable: false }
}

function emptyDepartmentMultiCodeRow() {
  return {
    departmentId: 0,
    departmentName: "",
    allowMultiCodes: false,
    assignedMultiCodes: "",
    activationStartDate: "",
    activationEndDate: "",
  }
}

function deptAllowsActivationDatesFromApi(
  userDept: UserTimeStudyDepartment | undefined,
  globalSettings: DeptSettingsLike | undefined,
): boolean {
  if (userDept != null) {
    return userDept.allowActivationStartDateAndEndDate === true
  }
  return globalSettings?.allowActivationStartDateAndEndDate === true
}

function DatePickerField({
  value,
  onChange,
  disabled,
  placeholder = "Select date",
}: {
  value: string | undefined
  onChange: (val: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const selectedDate = value ? new Date(value + "T00:00:00") : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="group min-h-[40px] w-full justify-between rounded-[6px] border border-[#d6d7dc] bg-white px-3 text-[12px] font-normal text-[#111827] hover:bg-white focus-visible:bg-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50"
        >
          <span className={value ? "text-[#111827]" : "text-[#b5bcc9]"}>
            {value ? displayDate(value) : placeholder}
          </span>
          <CalendarDays className="size-4 text-[#9ca3af]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0 z-50">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onChange(toIsoYmd(date))
            } else {
              onChange("")
            }
            setOpen(false)
          }}
          className="bg-white text-[14px]"
        />
      </PopoverContent>
    </Popover>
  )
}

/** UI tab: Security / Assignments */
export function SecurityAssignmentsPanel({
  mode,
  securityContextUserId = null,
  allowUnassignedQueryWithoutUserId,
  onAddModeTransferSucceeded,
}: SecurityAssignmentsPanelProps) {
  const securityRolesQuery = useGetSecurityDepartmentRoles(
    securityContextUserId,
    allowUnassignedQueryWithoutUserId,
  )

  const securityUserId = securityContextUserId?.trim() ?? ""
  const tab2Query = useGetUserDetailsTab(securityUserId, "tab2", Boolean(securityUserId))
  const tab2Data = useMemo(
    () => (tab2Query.data ? parseUserDetailsTab2(tab2Query.data) : undefined),
    [tab2Query.data],
  )
  const canPersistTransfers = securityUserId.length > 0
  const assignMutation = useAssignUserDepartmentRoles()
  const unassignMutation = useUnassignUserDepartmentRoles()
  const transferBusy = assignMutation.isPending || unassignMutation.isPending

  const isAddMode = mode === "add"
  const historyQuery = useGetUserAllowMulticodeHistory(securityUserId, !isAddMode)

  const {
    watch,
    control,
    setValue,
    getValues,
    formState: { dirtyFields },
  } = useFormContext<UserModuleFormValues>()

  useLayoutEffect(() => {
    if (isAddMode || !tab2Data || typeof tab2Data !== "object") return
    syncSecurityTab2Form(setValue, tab2Data)
  }, [isAddMode, tab2Data, setValue])

  const {
    fields: multiCodeFields,
    append: appendMultiCode,
    remove: removeMultiCode,
    replace: replaceMultiCodeRows,
  } = useFieldArray({
    control,
    name: "departmentMultiCodes",
  })

  const refetchSecurityRolesAndSyncForm = useCallback(async () => {
    if (!securityUserId) return
    const [refreshed, tab2Raw] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: addEmployeeLookupKeys.securityDepartmentRoles(securityUserId),
        queryFn: () => fetchSecurityDepartmentRoles(securityUserId),
        staleTime: 0,
      }),
      queryClient.fetchQuery({
        queryKey: addEmployeeLookupKeys.userDetailsTab(securityUserId, "tab2"),
        queryFn: () => fetchUserDetailsTab(securityUserId, "tab2"),
        staleTime: 0,
      }),
    ])
    syncSecurityAssignmentsForm(setValue, refreshed)
    syncSecurityTab2Form(setValue, parseUserDetailsTab2(tab2Raw))
  }, [securityUserId, setValue])

  const tab2Apportioning = useMemo(
    () => (tab2Data ? apportioningFieldsFromTab2(tab2Data) : null),
    [tab2Data],
  )

  const formSupervisorApportioning = watch("supervisorApportioning")
  const displaySupervisorApportioning = useMemo(() => {
    if (dirtyFields.supervisorApportioning) return formSupervisorApportioning
    return formSupervisorApportioning || (tab2Apportioning?.supervisorApportioning ?? false)
  }, [dirtyFields.supervisorApportioning, formSupervisorApportioning, tab2Apportioning])

  const securityRolesData =
    securityUserId && securityRolesQuery.isSuccess ? securityRolesQuery.data : undefined

  const formSecuritySnapshots = watch("securityAssignedSnapshots") ?? []
  const assignedRoles = watch("roleAssignments") ?? []

  const userDeptsLoadPromiseRef = useRef<Promise<UserTimeStudyDepartment[]> | null>(null)

  const hasHydratedRef = useRef(false)
  const prevUserIdRef = useRef(securityUserId)
  if (prevUserIdRef.current !== securityUserId) {
    hasHydratedRef.current = false
    prevUserIdRef.current = securityUserId
  }

  /** Prefer GET /assignedDepartment/roles when loaded; form state for add-before-userId. */
  const assignedSnapshots = useMemo(() => {
    if (securityRolesData?.assignedSnapshots.length) {
      return securityRolesData.assignedSnapshots
    }
    return formSecuritySnapshots
  }, [securityRolesData, formSecuritySnapshots])

  const assignedDepts = useMemo(() => {
    const seen = new Set<number>()
    const depts: { id: number; name: string }[] = []
    for (const s of assignedSnapshots) {
      if (s.departmentId && !seen.has(s.departmentId)) {
        seen.add(s.departmentId)
        depts.push({ id: s.departmentId, name: s.department })
      }
    }
    return depts.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
  }, [assignedSnapshots])

  const hasTimeStudySupervisorRole = useMemo(
    () => assignedSnapshots.some((s) => s.name.trim() === "Time Study Supervisor"),
    [assignedSnapshots],
  )

  const needsDepartmentSettingsForMultiCodes = assignedDepts.length > 0

  /** GET /departments/all — apportioning table + multi-code eligibility in add/edit. */
  const departmentsQuery = useGetAllDepartments(
    { status: "active", sort: "ASC" },
    {
      enabled:
        needsDepartmentSettingsForMultiCodes ||
        (hasTimeStudySupervisorRole && displaySupervisorApportioning),
    },
  )

  const userDeptsQuery = useGetUserTimeStudyDepartments(
    securityUserId,
    Boolean(securityUserId) && assignedDepts.length > 0,
    "timestudy",
  )

  /** Only departments with configured multi-codes (add + edit). */
  const assignedDeptsForMultiCodeRows = useMemo(() => {
    if (assignedDepts.length === 0) return []

    const userDeptList = userDeptsQuery.data ?? []
    const globalItems = departmentsQuery.data?.items ?? []
    const userDeptsReady = userDeptsQuery.isSuccess && userDeptList.length > 0
    const globalDeptsReady = departmentsQuery.isSuccess && globalItems.length > 0

    if (!userDeptsReady && !globalDeptsReady) return []

    return assignedDepts.filter((dept) => {
      const userDept = userDeptList.find((d) => Number(d.departmentId) === Number(dept.id))
      const globalDept = globalItems.find((d) => String(d.id) === String(dept.id))
      if (userDept != null) {
        return !departmentMultiCodeSupportFromApi(userDept, undefined).multiCodeNotAvailable
      }
      if (globalDept?.settings != null) {
        return !departmentMultiCodeSupportFromApi(undefined, globalDept.settings).multiCodeNotAvailable
      }
      return false
    })
  }, [
    assignedDepts,
    userDeptsQuery.isSuccess,
    userDeptsQuery.data,
    departmentsQuery.isSuccess,
    departmentsQuery.data?.items,
  ])

  const stripIneligibleDepartmentMultiCodeRows = useCallback(
    (rows: UserModuleFormValues["departmentMultiCodes"]) => {
      const userDeptList = userDeptsQuery.data ?? []
      const globalItems = departmentsQuery.data?.items ?? []
      if (!userDeptList.length && !globalItems.length) return rows

      return rows
        .filter((row) => {
          const deptId = Number(row.departmentId)
          if (!Number.isFinite(deptId) || deptId < 1) return true
          const userDept = userDeptList.find((d) => Number(d.departmentId) === deptId)
          const globalDept = globalItems.find((d) => String(d.id) === String(deptId))
          if (userDept != null) {
            return !departmentMultiCodeSupportFromApi(userDept, undefined).multiCodeNotAvailable
          }
          if (globalDept?.settings != null) {
            return !departmentMultiCodeSupportFromApi(undefined, globalDept.settings).multiCodeNotAvailable
          }
          return false
        })
        .map((row) => {
          // Also filter assigned codes within each row against what the dept currently allows.
          // E.g. if saved code is TCM but dept settings now only list MAA, clear TCM.
          const deptId = Number(row.departmentId)
          if (!Number.isFinite(deptId) || deptId < 1) return row
          const userDept = userDeptList.find((d) => Number(d.departmentId) === deptId)
          const globalDept = globalItems.find((d) => String(d.id) === String(deptId))
          const { allowedCodes } = departmentMultiCodeSupportFromApi(userDept, globalDept?.settings)
          if (allowedCodes.length === 0) return row // settings not ready yet — don't clear
          const current = parseMultiSelectStoredValues(row.assignedMultiCodes ?? "")
          const kept = current.filter((c) => allowedCodes.includes(c))
          const nextCodes = kept.join(",")
          if (nextCodes === (row.assignedMultiCodes ?? "")) return row
          // Only clear multicode selection + checkbox; preserve activation dates
          return {
            ...row,
            assignedMultiCodes: nextCodes,
            allowMultiCodes: nextCodes !== "" ? row.allowMultiCodes : false,
          }
        })
    },
    [userDeptsQuery.data, departmentsQuery.data?.items],
  )

  const hydratedEditRows = useMemo(() => {
    if (isAddMode) return []
    const userDeptList = userDeptsQuery.data ?? []
    const historyRows = historyQuery.data ?? []

    const latestHistoryByDept = new Map<number, (typeof historyRows)[number]>()
    for (const row of historyRows) {
      const deptId = Number(row.departmentId)
      if (!Number.isFinite(deptId) || deptId < 1) continue
      const existing = latestHistoryByDept.get(deptId)
      if (!existing) {
        latestHistoryByDept.set(deptId, row)
        continue
      }
      const existingTs = new Date(existing.updatedAt || existing.createdAt || 0).getTime()
      const nextTs = new Date(row.updatedAt || row.createdAt || 0).getTime()
      if (nextTs >= existingTs) latestHistoryByDept.set(deptId, row)
    }

    const deptSeed =
      assignedDeptsForMultiCodeRows.length > 0
        ? assignedDeptsForMultiCodeRows
        : Array.from(latestHistoryByDept.entries())
            .map(([id]) => ({
              id,
              name: userDeptList.find((d) => d.departmentId === id)?.departmentName ?? `Department ${id}`,
            }))
            .filter((dept) => {
              const userDept = userDeptList.find((d) => Number(d.departmentId) === Number(dept.id))
              if (userDept == null) return false
              return !departmentMultiCodeSupportFromApi(userDept, undefined).multiCodeNotAvailable
            })

    return deptSeed.map((dept) => {
      const deptHistory = latestHistoryByDept.get(Number(dept.id))
      const userDept = userDeptList.find((d) => Number(d.departmentId) === Number(dept.id))
      const globalDept = departmentsQuery.data?.items?.find((d) => String(d.id) === String(dept.id))

      const allowActivationDates =
        userDept == null || userDept.allowActivationStartDateAndEndDate === true

      // Filter saved codes against what the department currently allows.
      // If user saved MAA but dept settings now only list TCM, MAA is cleared.
      const { allowedCodes } = departmentMultiCodeSupportFromApi(userDept, globalDept?.settings)
      const historyCodes = (deptHistory?.multiCodeTypes ?? []).filter(Boolean)
      const validHistoryCodes = allowedCodes.length > 0
        ? historyCodes.filter((c) => allowedCodes.includes(c))
        : historyCodes
      const validAllowMultiCodes = deptHistory?.allowMultiCodes === true && validHistoryCodes.length > 0
      return {
        departmentId: Number(dept.id),
        departmentName: dept.name,
        allowMultiCodes: validAllowMultiCodes,
        assignedMultiCodes: validHistoryCodes.join(","),
        // Always restore dates from history — they are independent of multicode selection.
        // Even if the saved multicode was cleared (invalid), the dates should be kept.
        activationStartDate: allowActivationDates ? toDateInputValue(deptHistory?.startDate) : "",
        activationEndDate: allowActivationDates ? toDateInputValue(deptHistory?.endDate) : "",
      }
    })
  }, [isAddMode, userDeptsQuery.data, historyQuery.data, assignedDeptsForMultiCodeRows, departmentsQuery.data])

  const multiCodeRowsSyncStampRef = useRef<string>("")
  const multiCodeRowsModeRef = useRef<"none" | "rows">("rows")
  if (assignedDepts.length === 0) {
    if (multiCodeRowsModeRef.current !== "none") {
      replaceMultiCodeRows([])
      multiCodeRowsSyncStampRef.current = ""
      multiCodeRowsModeRef.current = "none"
    }
  } else if (multiCodeRowsModeRef.current === "none" && multiCodeFields.length === 0) {
    if (isAddMode) {
      replaceMultiCodeRows([emptyDepartmentMultiCodeRow()])
    }
    multiCodeRowsModeRef.current = "rows"
  }

  const deptSettingsReady =
    (userDeptsQuery.isSuccess && (userDeptsQuery.data?.length ?? 0) > 0) ||
    (departmentsQuery.isSuccess && (departmentsQuery.data?.items?.length ?? 0) > 0)

  if (deptSettingsReady || (!isAddMode && hydratedEditRows.length > 0)) {
    const current = getValues("departmentMultiCodes") ?? []
    let next = stripIneligibleDepartmentMultiCodeRows(current)

    if (!isAddMode && assignedDeptsForMultiCodeRows.length > 0 && hydratedEditRows.length > 0) {
      // Only hydrate once both user departments (multicode settings) AND history are loaded.
      // This ensures stale saved codes (e.g. MAA) are correctly filtered out against the
      // current department settings (e.g. only TCM is now allowed).
      const deptDataReady = userDeptsQuery.isSuccess || departmentsQuery.isSuccess
      if (!hasHydratedRef.current && deptDataReady) {
        next = hydratedEditRows
        hasHydratedRef.current = true
      }
    } else if (isAddMode && assignedDeptsForMultiCodeRows.length > 0 && next.length === 0) {
      next = [emptyDepartmentMultiCodeRow()]
    }

    const eligibleDeptKey = assignedDeptsForMultiCodeRows.map((d) => d.id).join(",")
    const settingsKey = `u${userDeptsQuery.isSuccess ? 1 : 0}:${userDeptsQuery.data?.length ?? 0}:g${departmentsQuery.isSuccess ? 1 : 0}:${departmentsQuery.data?.items?.length ?? 0}`
    const rowStamp = next
      .map(
        (r) =>
          `${r.departmentId}:${r.allowMultiCodes ? 1 : 0}:${r.assignedMultiCodes}:${r.activationStartDate}:${r.activationEndDate}`,
      )
      .join("|")
    const stamp = `${settingsKey}|${eligibleDeptKey}|${rowStamp}`

    if (stamp !== multiCodeRowsSyncStampRef.current) {
      replaceMultiCodeRows(next)
      multiCodeRowsSyncStampRef.current = stamp
    }
  }

  const { isSuperAdmin, user } = usePermissions()
  // All non-super-admin roles are restricted to their assigned departments only
  const isRestrictedNonSuperAdmin = !isSuperAdmin

  const allowedDepartmentNames = useMemo(() => {
    if (!isRestrictedNonSuperAdmin || !user?.departmentRoles) return null
    return new Set(user.departmentRoles.map(dr => dr.departmentName))
  }, [isRestrictedNonSuperAdmin, user?.departmentRoles])

  const syncDepartmentMultiCodeRowFromApi = useCallback(
    (rowIndex: number, userDeptList: UserTimeStudyDepartment[]) => {
      const deptId = Number(getValues(`departmentMultiCodes.${rowIndex}.departmentId`))
      if (!Number.isFinite(deptId) || deptId < 1) return

      const userDept = userDeptList.find((d) => Number(d.departmentId) === deptId)
      const globalDept = departmentsQuery.data?.items.find((d) => String(d.id) === String(deptId))
      const { multiCodeNotAvailable, allowedCodes } = departmentMultiCodeSupportFromApi(
        userDept,
        globalDept?.settings,
      )
      const allowActivationDates = deptAllowsActivationDatesFromApi(userDept, globalDept?.settings)

      if (!allowActivationDates) {
        setValue(`departmentMultiCodes.${rowIndex}.activationStartDate`, "", { shouldDirty: true })
        setValue(`departmentMultiCodes.${rowIndex}.activationEndDate`, "", { shouldDirty: true })
      }

      if (multiCodeNotAvailable) {
        const current = getValues("departmentMultiCodes") ?? []
        const next = current.filter((row) => Number(row.departmentId) !== deptId)
        if (next.length !== current.length) {
          replaceMultiCodeRows(
            isAddMode && next.length === 0 ? [emptyDepartmentMultiCodeRow()] : next,
          )
        }
        return
      }

      const current = parseMultiSelectStoredValues(
        getValues(`departmentMultiCodes.${rowIndex}.assignedMultiCodes`) ?? "",
      )
      const kept = current.filter((c) => allowedCodes.includes(c))
      const next = kept.join(",")
      const prev = String(getValues(`departmentMultiCodes.${rowIndex}.assignedMultiCodes`) ?? "")
      if (next !== prev) {
        setValue(`departmentMultiCodes.${rowIndex}.assignedMultiCodes`, next, { shouldDirty: true })
      }
    },
    [departmentsQuery.data?.items, getValues, setValue, replaceMultiCodeRows, isAddMode],
  )

  const invalidateUserDeptsCache = useCallback(() => {
    if (!securityUserId) return
    userDeptsLoadPromiseRef.current = null
    void queryClient.invalidateQueries({
      queryKey: addEmployeeLookupKeys.userDepartments(securityUserId, "timestudy"),
    })
  }, [securityUserId])

  const ensureUserDeptsLoaded = useCallback(
    async (options?: { requiredDeptId?: number; force?: boolean }): Promise<UserTimeStudyDepartment[]> => {
      if (!securityUserId) return []
      const requiredDeptId = options?.requiredDeptId
      const force = options?.force === true
      const cached = userDeptsQuery.data
      const cacheCoversDept =
        requiredDeptId == null ||
        !Number.isFinite(requiredDeptId) ||
        requiredDeptId < 1 ||
        (cached?.some((d) => Number(d.departmentId) === Number(requiredDeptId)) ?? false)

      if (!force && cacheCoversDept && userDeptsQuery.isSuccess && cached) {
        return cached
      }
      if (userDeptsLoadPromiseRef.current) {
        return userDeptsLoadPromiseRef.current
      }
      const load = userDeptsQuery
        .refetch()
        .then((result) => result.data ?? [])
        .finally(() => {
          userDeptsLoadPromiseRef.current = null
        })
      userDeptsLoadPromiseRef.current = load
      return load
    },
    [securityUserId, userDeptsQuery],
  )

  const fetchUserDeptsForRow = useCallback(
    async (rowIndex: number) => {
      if (!securityUserId) return
      const deptId = Number(getValues(`departmentMultiCodes.${rowIndex}.departmentId`))
      if (!Number.isFinite(deptId) || deptId < 1) return
      const list = await ensureUserDeptsLoaded({ requiredDeptId: deptId })
      syncDepartmentMultiCodeRowFromApi(rowIndex, list)
    },
    [securityUserId, ensureUserDeptsLoaded, getValues, syncDepartmentMultiCodeRowFromApi],
  )

  const isApportioningEnabled = useMemo(() => {
    if (assignedSnapshots.length === 0 || !hasTimeStudySupervisorRole) return false
    if (!departmentsQuery.data?.items?.length) return true
    const supervisorDeptIds = new Set(
      assignedSnapshots
        .filter((s) => s.name.trim() === "Time Study Supervisor")
        .map((s) => String(s.departmentId))
    )
    const userDeptIds = new Set(
      assignedSnapshots
        .filter((s) => s.name.trim() === "User")
        .map((s) => String(s.departmentId))
    )
    return departmentsQuery.data.items.some(
      (dept) =>
        supervisorDeptIds.has(String(dept.id)) &&
        userDeptIds.has(String(dept.id)) &&
        dept.settings.apportioning,
    )
  }, [assignedSnapshots, hasTimeStudySupervisorRole, departmentsQuery.data?.items])


  /** Left column: `data.unassigned` → flat rows (`id` = `deptId-roleId`). */
  const unassignedItems = useMemo(() => {
    if (!securityRolesQuery.isSuccess || !securityRolesQuery.data) return []
    let data = securityRolesQuery.data.unassigned

    if (isRestrictedNonSuperAdmin && allowedDepartmentNames) {
      data = data.filter((i) => allowedDepartmentNames.has(i.department))
    }

    if (!securityUserId) {
      const snapIds = new Set(assignedSnapshots.map((s) => s.id))
      const assignedPairKeys = new Set(
        assignedSnapshots.map((s) => departmentRolePairKey(s.department, s.name)),
      )
      return data.filter((i) => {
        if (snapIds.has(i.id)) return false
        if (assignedPairKeys.has(departmentRolePairKey(i.department, i.name))) return false
        return true
      })
    }

    return data
  }, [
    securityRolesQuery.data,
    securityRolesQuery.isSuccess,
    securityUserId,
    assignedSnapshots,
    isRestrictedNonSuperAdmin,
    allowedDepartmentNames,
  ])

  /** Right column: flat rows from `data.assigned`, grouped by department in RoleTransferPanel. */
  const assignedItems = useMemo((): AddEmployeeSecurityRoleItem[] => {
    if (assignedSnapshots.length > 0) {
      return securityRoleItemsFromSnapshots(assignedSnapshots)
    }
    const out: AddEmployeeSecurityRoleItem[] = []
    const seen = new Set<string>()
    for (const name of assignedRoles) {
      const n = name.trim()
      if (!n || seen.has(n)) continue
      seen.add(n)
      out.push({
        id: `assigned:${normalizeRoleId(n)}`,
        name: n,
        department: "Assigned",
      })
    }
    return out
  }, [assignedSnapshots, assignedRoles])

  const [toggledU, setToggledU] = useState<string[]>([])
  const [toggledA, setToggledA] = useState<string[]>([])
  const [showSecurityDeptRoleHistory, setShowSecurityDeptRoleHistory] = useState(false)
  const [securityDeptRoleHistoryDeptName, setSecurityDeptRoleHistoryDeptName] = useState("")
  const [securityDeptRoleHistoryRoleName, setSecurityDeptRoleHistoryRoleName] = useState("")

  const toggle = (id: string, isAssigned: boolean) => {
    const list = isAssigned ? assignedItems : unassignedItems
    const toggled = isAssigned ? toggledA : toggledU
    const setToggled = isAssigned ? setToggledA : setToggledU

    const item = list.find((i) => i.id === id)
    if (!item) return
    const isSelecting = !toggled.includes(id)
    const roleName = item.name.trim()

    // 1. Department Admin selects everything in dept except Payroll Admin
    if (roleName === "Department Admin") {
      const peerIds = list
        .filter((i) => i.department === item.department && i.name.trim() !== "Payroll Admin")
        .map((i) => i.id)

      if (isSelecting) {
        setToggled((prev) => [...new Set([...prev, ...peerIds, id])])
      } else {
        setToggled((prev) => prev.filter((x) => x !== id && !peerIds.includes(x)))
      }
      return
    }

    // 2. Time Study Admin selects Time Study Supervisor and User
    if (roleName === "Time Study Admin") {
      const targets = ["Time Study Supervisor", "User"]
      const peerIds = list
        .filter((i) => i.department === item.department && targets.includes(i.name.trim()))
        .map((i) => i.id)

      if (isSelecting) {
        setToggled((prev) => [...new Set([...prev, ...peerIds, id])])
      } else {
        setToggled((prev) => prev.filter((x) => x !== id && !peerIds.includes(x)))
      }
      return
    }

    // 3. Time Study Supervisor selects User
    if (roleName === "Time Study Supervisor") {
      const peerIds = list
        .filter((i) => i.department === item.department && i.name.trim() === "User")
        .map((i) => i.id)

      if (isSelecting) {
        setToggled((prev) => [...new Set([...prev, ...peerIds, id])])
      } else {
        setToggled((prev) => prev.filter((x) => x !== id && !peerIds.includes(x)))
      }
      return
    }

    // Default toggle
    setToggled((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  }

  const toggleAllUnassigned = () => {
    setToggledU((prev) =>
      prev.length === unassignedItems.length ? [] : unassignedItems.map((i) => i.id),
    )
  }

  const toggleAllAssigned = () => {
    setToggledA((prev) =>
      prev.length === assignedItems.length ? [] : assignedItems.map((i) => i.id),
    )
  }

  // Atomic dept-level toggle — selects/deselects all roles in one department at once
  const toggleDepartmentGroupU = (idsToAdd: string[], idsToRemove: string[]) => {
    setToggledU((prev) => {
      const next = new Set(prev)
      idsToRemove.forEach((id) => next.delete(id))
      idsToAdd.forEach((id) => next.add(id))
      return Array.from(next)
    })
  }

  const toggleDepartmentGroupA = (idsToAdd: string[], idsToRemove: string[]) => {
    setToggledA((prev) => {
      const next = new Set(prev)
      idsToRemove.forEach((id) => next.delete(id))
      idsToAdd.forEach((id) => next.add(id))
      return Array.from(next)
    })
  }

  const transferToAssigned = async () => {
    if (toggledU.length === 0) return
    const catalog = securityRolesQuery.data?.unassigned ?? []
    const toAdd = catalog.filter((i) => toggledU.includes(i.id))
    if (toAdd.length === 0) {
      setToggledU([])
      return
    }

    const departments = buildUserDepartmentRoleDepartmentsPayload(toAdd)
    if (departments.length === 0) {
      toast.error("Could not assign: invalid role selection.")
      return
    } 

    if (canPersistTransfers) {
      try {
        await assignMutation.mutateAsync({
          userId: securityUserId,
          departments,
          apportioningRequired: getValues("supervisorApportioning"),
          apportioningAllocation: [], // Role assignment only - do not update percentages
        })
        toast.success("Roles assigned.", addEmployeeTransferSuccessToastOptions)
        await refetchSecurityRolesAndSyncForm()
        invalidateUserDeptsCache()
        if (!isAddMode) {
          await ensureUserDeptsLoaded({ force: true })
        }
        setToggledU([])
        if (isAddMode) {
          onAddModeTransferSucceeded?.()
        }
        return
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Assign failed")
        return
      }
    }

    const prev = getValues("securityAssignedSnapshots") ?? []
    const nextSnaps = [...prev]
    for (const i of toAdd) {
      if (nextSnaps.some((s) => s.id === i.id)) continue
      const departmentId = departmentIdFromSecurityCatalogItemId(i.id)
      if (departmentId == null) continue
      nextSnaps.push({
        id: i.id,
        name: i.name,
        departmentId,
        department: i.department,
      })
    }
    setValue("securityAssignedSnapshots", nextSnaps, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    setValue(
      "roleAssignments",
      [...new Set(nextSnaps.map((s) => s.name.trim()).filter(Boolean))],
      { shouldDirty: true, shouldTouch: true, shouldValidate: true },
    )
    invalidateUserDeptsCache()
    setToggledU([])
    if (isAddMode) {
      onAddModeTransferSucceeded?.()
    }
  }

  const transferToUnassigned = async () => {
    if (toggledA.length === 0) return
    const toRemoveItems = assignedItems.filter((i) => toggledA.includes(i.id))
    if (toRemoveItems.length === 0) {
      setToggledA([])
      return
    }

    if (canPersistTransfers) {
      const invalid = toRemoveItems.some(
        (i) =>
          i.id.startsWith("assigned:") ||
          departmentIdFromSecurityCatalogItemId(i.id) == null ||
          roleRefIdFromSecurityCatalogItemId(i.id) == null,
      )
      if (invalid) {
        toast.error("Some assignments cannot be updated on the server. Reload this user and try again.")
        return
      }
      const departments = buildUserDepartmentRoleDepartmentsPayload(toRemoveItems)
      if (departments.length === 0) {
        toast.error("Could not unassign: invalid role selection.")
        return
      }
      try {
        await unassignMutation.mutateAsync({
          userId: securityUserId,
          departments,
          apportioningRequired: getValues("supervisorApportioning"),
          apportioningAllocation: [], // Role assignment only - do not update percentages
        })
        toast.success("Roles unassigned.", addEmployeeTransferSuccessToastOptions)
        await refetchSecurityRolesAndSyncForm()
        invalidateUserDeptsCache()
        setToggledA([])
        return
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Unassign failed")
        return
      }
    }

    if (isAddMode) {
      const removeIds = new Set(toRemoveItems.map((i) => i.id))
      const removedDeptIds = new Set(
        toRemoveItems
          .map((i) => departmentIdFromSecurityCatalogItemId(i.id))
          .filter((id): id is number => id != null)
          .map(String),
      )

      const prev = getValues("securityAssignedSnapshots") ?? []
      const nextSnaps = prev.filter((s) => !removeIds.has(s.id))

      // Clear stale allocations
      const currentAllocations = { ...getValues("apportioningAllocations") }
      removedDeptIds.forEach((id) => delete currentAllocations[id])

      setValue("securityAssignedSnapshots", nextSnaps, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      setValue("apportioningAllocations", currentAllocations, { shouldDirty: true })
      setValue(
        "roleAssignments",
        [...new Set(nextSnaps.map((s) => s.name.trim()).filter(Boolean))],
        { shouldDirty: true, shouldTouch: true, shouldValidate: true },
      )
      invalidateUserDeptsCache()
      setToggledA([])
      onAddModeTransferSucceeded?.()
      return
    }
    const prevSnaps = getValues("securityAssignedSnapshots") ?? []
    if (prevSnaps.length > 0) {
      const removeIds = new Set(toRemoveItems.map((i) => i.id))
      const removedDeptIds = new Set(
        toRemoveItems
          .map((i) => departmentIdFromSecurityCatalogItemId(i.id))
          .filter((id): id is number => id != null)
          .map(String),
      )

      const nextSnaps = prevSnaps.filter((s) => !removeIds.has(s.id))

      // Clear stale allocations
      const currentAllocations = { ...getValues("apportioningAllocations") }
      removedDeptIds.forEach((id) => delete currentAllocations[id])

      setValue("securityAssignedSnapshots", nextSnaps, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      setValue("apportioningAllocations", currentAllocations, { shouldDirty: true })
      setValue(
        "roleAssignments",
        [...new Set(nextSnaps.map((s) => s.name.trim()).filter(Boolean))],
        { shouldDirty: true, shouldTouch: true, shouldValidate: true },
      )
    } else {
      const namesToRemove = toRemoveItems.map((i) => i.name)
      const next = assignedRoles.filter((r) => !namesToRemove.includes(r))
      setValue("roleAssignments", next, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    }
    invalidateUserDeptsCache()
    setToggledA([])
  }

  const firstName = watch("firstName")
  const lastName = watch("lastName")
  const fullName =
    `${firstName ?? tab2Data?.firstName ?? ""} ${lastName ?? tab2Data?.lastName ?? ""}`.trim() ||
    tab2Data?.name?.trim() ||
    ""

  return (
    <div className="relative min-w-0 pt-1">
      {showSecurityDeptRoleHistory && canPersistTransfers ? (
        <>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            {isAddMode ? (
              <div className="flex items-center gap-4">
                <label className="flex cursor-not-allowed items-center gap-2 text-[11px] select-none text-[#9ca3af]">
                  <Controller
                    name="copyUser"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                        disabled
                        className="size-4 rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-(--primary) data-[state=checked]:bg-(--primary) disabled:cursor-not-allowed disabled:bg-[#f3f4f6] disabled:border-[#e5e7eb] disabled:opacity-100"
                      />
                    )}
                  />
                  Copy User
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  className="h-10 w-[280px] rounded-[10px] border border-[#e5e7eb] bg-[#f3f4f6] px-3 text-[11px] outline-none transition-colors cursor-not-allowed text-[#9ca3af]"
                />
              </div>
            ) : (
              <p className="text-[12px] font-semibold uppercase text-[#111827]">{fullName}</p>
            )}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              className="h-9 cursor-pointer gap-2 rounded-[12px] border border-[#E5E7EB] bg-white px-3 text-[12px] font-semibold text-[#6C5DD3] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:border-[#6C5DD3] hover:bg-[#F3F0FF]"
              onClick={() => {
                setShowSecurityDeptRoleHistory(false)
                setSecurityDeptRoleHistoryDeptName("")
                setSecurityDeptRoleHistoryRoleName("")
              }}
            >
              <ArrowLeft className="size-3.5" />
              Back to Security
            </Button>
            <TitleCaseInput
              placeholder="Search Department Name"
              value={securityDeptRoleHistoryDeptName}
              onChange={(e) => setSecurityDeptRoleHistoryDeptName(e.target.value)}
              className="h-[41px] w-[220px] rounded-[10px] border border-[#d0d5df] bg-white px-3.5 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
            />
            <TitleCaseInput
              placeholder="Search Role Name"
              value={securityDeptRoleHistoryRoleName}
              onChange={(e) => setSecurityDeptRoleHistoryRoleName(e.target.value)}
              className="h-[41px] w-[200px] rounded-[10px] border border-[#d0d5df] bg-white px-3.5 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
            />
          </div>

          <Suspense
            fallback={
              <div className="flex min-h-[240px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white">
                <Spinner className="text-[#6C5DD3]" />
              </div>
            }
          >
            <DepartmentRoleHistoryTable
              userId={securityUserId}
              departmentName={securityDeptRoleHistoryDeptName}
              roleName={securityDeptRoleHistoryRoleName}
              historyKind={DEPARTMENT_ROLE_USER_ASSIGNMENT_HISTORY_KIND}
              columnLayout="assignment"
            />
          </Suspense>
        </>
      ) : (
        <>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          {isAddMode ? (
            <>
              <label className="flex cursor-not-allowed items-center gap-2 text-[11px] select-none text-[#9ca3af]">
                <Controller
                  name="copyUser"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      disabled
                      className="size-4 rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-(--primary) data-[state=checked]:bg-(--primary) disabled:cursor-not-allowed disabled:bg-[#f3f4f6] disabled:border-[#e5e7eb] disabled:opacity-100"
                    />
                  )}
                />
                Copy User
              </label>

              <input
                type="text"
                readOnly
                disabled
                className="h-10 w-[280px] rounded-[10px] border border-[#e5e7eb] bg-[#f3f4f6] px-3 text-[11px] outline-none transition-colors cursor-not-allowed text-[#9ca3af]"
              />
            </>
          ) : (
            <p className="text-[12px] font-semibold uppercase text-[#111827]">
              {fullName}
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-3 sm:justify-end sm:gap-5 sm:pr-1 sm:pt-2">
          <label className={`flex items-center gap-2 text-[11px] select-none ${isApportioningEnabled ? "cursor-pointer text-[#111827]" : "cursor-not-allowed text-[#9ca3af]"}`}>
            <Controller
              name="supervisorApportioning"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={
                    isApportioningEnabled
                      ? dirtyFields.supervisorApportioning
                        ? field.value
                        : field.value || (tab2Apportioning?.supervisorApportioning ?? false)
                      : false
                  }
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  disabled={!isApportioningEnabled}
                  className="size-4 rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-(--primary) data-[state=checked]:bg-(--primary) disabled:cursor-not-allowed disabled:bg-[#f3f4f6] disabled:border-[#e5e7eb] disabled:opacity-100"
                />
              )}
            />
            Supervisor Apportioning
          </label>

          {isSuperAdmin && (
            <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] text-[#111827]">
              <Controller
                name="clientAdmin"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="size-4 cursor-pointer rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-(--primary) data-[state=checked]:bg-(--primary)"
                  />
                )}
              />
              Client Admin
            </label>
          )}

          {canPersistTransfers ? (
            <Button
              type="button"
              className="inline-flex h-auto min-h-9 shrink cursor-pointer items-center gap-2 whitespace-normal rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-2 text-[11px] font-semibold leading-snug text-[#6C5DD3] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:border-[#6C5DD3] hover:bg-[#F3F0FF] sm:text-[12px]"
              onClick={() => setShowSecurityDeptRoleHistory(true)}
            >
              <History className="size-3.5 shrink-0" />
              Department Role History
            </Button>
          ) : null}
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-[1fr_60px_1fr] items-center gap-4">
        {(securityRolesQuery.isLoading ||
          (Boolean(securityUserId) && tab2Query.isLoading) ||
          transferBusy) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60">
            <Spinner className="text-[#6C5DD3]" />
          </div>
        )}
        <RoleTransferPanel
          title="Select Department(Unassigned)"
          items={unassignedItems}
          selectedIds={toggledU}
          onToggleItem={(id) => toggle(id, false)}
          onToggleAll={toggleAllUnassigned}
          onToggleDepartmentGroup={toggleDepartmentGroupU}
        />

        <div className="flex flex-col gap-3 pt-10">
          <TransferListMoveButton
            direction="forward"
            onClick={() => void transferToAssigned()}
            disabled={toggledU.length === 0 || transferBusy}
            aria-label="Move selected to assigned"
          />
          <TransferListMoveButton
            direction="back"
            onClick={() => void transferToUnassigned()}
            disabled={toggledA.length === 0 || transferBusy}
            aria-label="Move selected to unassigned"
          />
        </div>

        <RoleTransferPanel
          title="Select Department(Assigned)"
          items={assignedItems}
          selectedIds={toggledA}
          onToggleItem={(id) => toggle(id, true)}
          onToggleAll={toggleAllAssigned}
          onToggleDepartmentGroup={toggleDepartmentGroupA}
        />
      </div>

      {displaySupervisorApportioning && isApportioningEnabled && (
        <div className="mt-8 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300">
          <table className="w-full text-left text-[12px] border-collapse">
            <thead>
              <tr className="bg-(--primary) text-white">
                <th className="px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider">Department Name</th>
                <th className="px-5 py-2.5 text-[10.5px] font-semibold text-center uppercase tracking-wider">Apportioning</th>
                <th className="px-5 py-2.5 text-[10.5px] font-semibold text-center uppercase tracking-wider">Percentage of allocation</th>
                <th className="px-5 py-2.5 text-[10.5px] font-semibold text-center uppercase tracking-wider">Auto Apportioning</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const supervisorRoleName = "Time Study Supervisor"
                const deptsWithSupervisor = new Set(
                  assignedSnapshots
                    .filter(s => s.name.trim() === supervisorRoleName)
                    .map(s => s.departmentId)
                )
                const deptsWithUser = new Set(
                  assignedSnapshots
                    .filter(s => s.name.trim() === "User")
                    .map(s => s.departmentId)
                )
                const qualifiedDeptIds = Array.from(deptsWithSupervisor).filter(id => deptsWithUser.has(id))

                const assignedDepts = qualifiedDeptIds
                  .map(id => {
                    const snap = assignedSnapshots.find(s => s.departmentId === id)
                    const deptInfo = departmentsQuery.data?.items.find(d => String(d.id) === String(id))
                    return {
                      id: String(id),
                      name: snap?.department ?? deptInfo?.name ?? `Dept ${id}`,
                      apportioning: deptInfo?.settings.apportioning ?? false,
                      autoApportioning: deptInfo?.settings.autoApportioning ?? false,
                    }
                  })
                  .filter(dept => dept.apportioning)

                if (assignedDepts.length === 0) {
                  return (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-[#9ca3af] bg-[#f9fafb]">
                        <p className="text-[13px]">No departments assigned yet.</p>
                        <p className="mt-1 text-[11px]">Assign departments to manage apportioning allocations.</p>
                      </td>
                    </tr>
                  )
                }

                return assignedDepts.map((dept) => (
                  <tr key={dept.id} className="border-t border-[#f1f2f6] hover:bg-[#f8fafc] transition-colors duration-200">
                    <td className="px-5 py-4 font-medium text-[#111827]">{dept.name}</td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center items-center">
                        {dept.apportioning ? (
                          <img src={statusCheck} alt="Checked" className="size-5 object-contain" />
                        ) : (
                          <img src={statusCross} alt="Unchecked" className="size-5 object-contain" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center">
                        <Controller
                          name={`apportioningAllocations.${dept.id}`}
                          control={control}
                          render={({ field }) => (
                        <div className="flex justify-center">
                          <input
                            {...field}
                            type="text"
                            value={
                              field.value ??
                              tab2Apportioning?.apportioningAllocations?.[dept.id] ??
                              ""
                            }
                            placeholder=""
                            className="h-8 w-20 rounded-[4px] border border-[#cbd5e1] bg-white px-2 text-center text-[12px] font-medium text-[#111827] outline-none transition-all focus:border-(--primary) focus:ring-1 focus:ring-(--primary)"
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, "")
                              field.onChange(val)
                            }}
                          />
                        </div>
                          )}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center items-center">
                        {dept.autoApportioning ? (
                          <img src={statusCheck} alt="Checked" className="size-5 object-contain" />
                        ) : (
                          <img src={statusCross} alt="Unchecked" className="size-5 object-contain" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              })()}
            </tbody>
          </table>
        </div>
      )}

      {assignedDeptsForMultiCodeRows.length > 0 ? (
      <div className="mt-8 mb-6">
        {/* Top-right + icon */}
        <div className="flex justify-end mb-4 pr-1">
          <button
            type="button"
            disabled={!(multiCodeFields.length < assignedDeptsForMultiCodeRows.length)}
            onClick={() => {
              if (multiCodeFields.length < assignedDeptsForMultiCodeRows.length) {
                appendMultiCode({
                  departmentId: 0,
                  departmentName: "",
                  allowMultiCodes: false,
                  assignedMultiCodes: "",
                  activationStartDate: "",
                  activationEndDate: "",
                })
              }
            }}
            className={`flex items-center justify-center size-7 rounded-full border-2 transition-all bg-white ${
              multiCodeFields.length < assignedDeptsForMultiCodeRows.length
                ? "border-[#22c55e] text-[#22c55e] hover:bg-green-50/30 cursor-pointer"
                : "border-[#9ca3af] text-[#9ca3af] cursor-not-allowed"
            }`}
            title="Add another department"
          >
            <Plus className="size-4" strokeWidth={3} />
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {(() => {
            const currentMultiCodes = watch("departmentMultiCodes") || []
            const selectedDeptIds = currentMultiCodes
              .map((c: any) => Number(c.departmentId))
              .filter((id: number) => Number.isFinite(id) && id > 0)

            return multiCodeFields.map((field, index) => {
              const isAllowEnabled = watch(`departmentMultiCodes.${index}.allowMultiCodes`)
              const currentDeptName = watch(`departmentMultiCodes.${index}.departmentName`)
              const currentAssignedMultiCodes = watch(`departmentMultiCodes.${index}.assignedMultiCodes`)
              const hasSelectedMultiCodes =
                parseMultiSelectStoredValues(currentAssignedMultiCodes ?? "").length > 0
              
              // Resolve selected department settings from user time-study departments API response
              const currentDeptId = watch(`departmentMultiCodes.${index}.departmentId`)
              const userDeptConfig = userDeptsQuery.data?.find((d) => {
                if (currentDeptId) return String(d.departmentId) === String(currentDeptId)
                return d.departmentName === currentDeptName
              })
              const globalDeptConfig = departmentsQuery.data?.items.find(
                (d) =>
                  String(d.id) === String(currentDeptId) ||
                  d.name === currentDeptName,
              )?.settings

              const deptSelected = Number(currentDeptId) > 0 && Boolean(currentDeptName?.trim())
              const deptAllowsActivationDates = deptAllowsActivationDatesFromApi(
                userDeptConfig,
                globalDeptConfig,
              )

              return (
                <div key={field.id} className="flex items-start gap-4 w-full relative">
                  
                  {/* Department */}
                  <div className="flex-[1.2] flex flex-col">
                    <div className="h-[22px] mb-1 flex items-end">
                      <label className="block text-[11px] font-normal text-[#374151]">
                        Department <span className="text-red-500">*</span>
                      </label>
                    </div>
                    <Controller
                      name={`departmentMultiCodes.${index}.departmentId`}
                      control={control}
                      render={({ field: dFieldId }) => (
                        <Select
                          value={
                            Number(dFieldId.value) > 0 ? String(dFieldId.value) : undefined
                          }
                          onValueChange={(val) => {
                            const found = assignedDeptsForMultiCodeRows.find((d) => String(d.id) === val)
                            if (found) {
                              // Reset the fields for this row on department change
                              setValue(`departmentMultiCodes.${index}.allowMultiCodes`, false)
                              setValue(`departmentMultiCodes.${index}.assignedMultiCodes`, "")
                              setValue(`departmentMultiCodes.${index}.activationStartDate`, "")
                              setValue(`departmentMultiCodes.${index}.activationEndDate`, "")

                              dFieldId.onChange(found.id)
                              setValue(`departmentMultiCodes.${index}.departmentName`, found.name)
                              void fetchUserDeptsForRow(index)
                            }
                          }}
                        >
                          <SelectTrigger className="!h-[40px] w-full rounded-[6px] border border-[#d1d5db] bg-white px-3 text-[12px] text-[#111827] focus:ring-1 focus:ring-[#3b82f6] shadow-sm disabled:cursor-not-allowed disabled:bg-gray-50">
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="z-[100] max-h-60 overflow-y-auto w-(--radix-select-trigger-width) bg-white rounded-[6px]">
                            {assignedDeptsForMultiCodeRows
                              .filter((d) => !selectedDeptIds.includes(Number(d.id)) || Number(dFieldId.value) === Number(d.id))
                              .map((d) => (
                                <SelectItem 
                                  key={d.id} 
                                  value={String(d.id)}
                                  className="text-[12px] rounded-[4px] py-2"
                                >
                                  {d.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Allow MultiCodes & MultiCodes Select Column */}
                  <div className="flex-[1.5] flex flex-col">
                    <div className="h-[22px] mb-1 flex items-end justify-between">
                      <div className="flex items-center gap-2">
                        <Controller
                          name={`departmentMultiCodes.${index}.allowMultiCodes`}
                          control={control}
                          render={({ field: cField }) => {
                            const allowCheckboxSupport = departmentMultiCodeSupportFromApi(
                              userDeptConfig,
                              globalDeptConfig,
                            )
                            const allowCheckboxBlocked =
                              userDeptsQuery.isFetched &&
                              Number(currentDeptId) > 0 &&
                              allowCheckboxSupport.multiCodeNotAvailable
                            const isCheckboxDisabled = allowCheckboxBlocked || !deptSelected
                            return (
                              <Checkbox
                                id={`allow-multicodes-checkbox-${index}`}
                                checked={cField.value === true}
                                disabled={isCheckboxDisabled}
                                onCheckedChange={(checked) => {
                                  const on = checked === true
                                  cField.onChange(on)
                                  if (on) {
                                    setValue(`departmentMultiCodes.${index}.activationEndDate`, "", {
                                      shouldDirty: true,
                                    })
                                    const deptId = Number(
                                      getValues(`departmentMultiCodes.${index}.departmentId`),
                                    )
                                    if (deptId > 0) {
                                      void fetchUserDeptsForRow(index)
                                    }
                                  }
                                }}
                                className="size-4 cursor-pointer rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-(--primary) data-[state=checked]:bg-(--primary) disabled:cursor-not-allowed disabled:opacity-60"
                              />
                            )
                          }}
                        />
                        <label 
                          htmlFor={`allow-multicodes-checkbox-${index}`} 
                          className={`text-[11px] font-normal whitespace-nowrap select-none ${
                            !deptSelected ? "text-[#9ca3af] cursor-not-allowed" : "text-[#374151] cursor-pointer"
                          }`}
                        >
                          Allow MultiCodes
                        </label>
                      </div>
                      {!isAddMode && (
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <History className="size-[14px] text-(--primary) cursor-pointer hover:text-[#5244b2] transition-colors" />
                          </HoverCardTrigger>
                          <HoverCardContent className="w-auto p-4 z-[100] shadow-lg rounded-[8px]" align="center" side="top">
                            <div className="text-[12px] font-bold text-[#111827] mb-3">MultiCodes History</div>
                            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                              <table className="w-full text-left text-[12px] border-collapse whitespace-nowrap">
                                <thead className="bg-[#6b5cd6] text-white sticky top-0 z-10">
                                  <tr>
                                    <th className="px-3 py-2 font-medium font-inter">Department</th>
                                    <th className="px-3 py-2 font-medium font-inter border-l border-[#897ee0]">MultiCode</th>
                                    <th className="px-3 py-2 font-medium font-inter border-l border-[#897ee0]">Activation Start Date</th>
                                    <th className="px-3 py-2 font-medium font-inter border-l border-[#897ee0]">Activation End Date</th>
                                    <th className="px-3 py-2 font-medium font-inter border-l border-[#897ee0]">Updated At</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e7eb]">
                                  {historyQuery.data?.filter((row) => {
                                    const rowDeptId = Number(row.departmentId ?? 0)
                                    if (rowDeptId > 0 && currentDeptId) {
                                      return rowDeptId === Number(currentDeptId)
                                    }
                                    const rowDeptName = assignedDepts.find(d => Number(d.id) === rowDeptId)?.name ?? ""
                                    return rowDeptName === currentDeptName
                                  }).length ? historyQuery.data
                                  ?.filter((row) => {
                                    const rowDeptId = Number(row.departmentId ?? 0)
                                    if (rowDeptId > 0 && currentDeptId) {
                                      return rowDeptId === Number(currentDeptId)
                                    }
                                    const rowDeptName = assignedDepts.find(d => Number(d.id) === rowDeptId)?.name ?? ""
                                    return rowDeptName === currentDeptName
                                  })
                                  .map((row, i) => {
                                    const deptName = assignedDepts.find(d => d.id === row.departmentId)?.name ?? "-"
                                    const multiCodes = row.multiCodeTypes?.join(", ") || "-"
                                    const sDate = displayDate(row.startDate)
                                    const eDate = row.endDate ? displayDate(row.endDate) : "-"
                                    const uDate = displayDate(row.updatedAt)
                                    return (
                                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2 text-[#374151]">{deptName}</td>
                                        <td className="px-3 py-2 text-[#374151]">{multiCodes}</td>
                                        <td className="px-3 py-2 text-[#374151]">{sDate}</td>
                                        <td className="px-3 py-2 text-[#374151]">{eDate}</td>
                                        <td className="px-3 py-2 text-[#374151]">{uDate}</td>
                                      </tr>
                                    )
                                  }) : (
                                    <tr>
                                      <td colSpan={5} className="px-4 py-6 text-center text-[#6b7280]">
                                        {historyQuery.isLoading ? "Loading history..." : "No history for selected department."}
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      )}
                    </div>
                    <div className="h-[40px] flex items-center w-full">
                      <div className="w-full h-full">
                        <Controller
                          name={`departmentMultiCodes.${index}.assignedMultiCodes`}
                          control={control}
                          render={({ field: aField }) => {
                            const deptSupport = departmentMultiCodeSupportFromApi(
                              userDeptConfig,
                              globalDeptConfig,
                            )
                            const availableCodes = deptSupport.allowedCodes
                            const deptApiKnown =
                              userDeptsQuery.isFetched && Number(currentDeptId) > 0
                            const multiCodeBlocked =
                              deptApiKnown && deptSupport.multiCodeNotAvailable
                            const tokens = parseMultiSelectStoredValues(aField.value ?? "")
                            const rowNames = new Set(availableCodes)
                            const orphanTokens = multiCodeBlocked
                              ? []
                              : [...new Set(tokens.filter((t) => !rowNames.has(t)))]
                            const options = [
                              ...availableCodes.map((c) => ({ value: c, label: c })),
                              ...orphanTokens.map((t) => ({ value: t, label: t })),
                            ]
                            const displayValue = multiCodeBlocked ? "" : (aField.value ?? "")
                            return (
                              <MultiSelectDropdown
                                value={displayValue}
                                onChange={(val) => {
                                  aField.onChange(val)
                                  // Reset date when multicode selection is cleared
                                  if (!val) {
                                    setValue(`departmentMultiCodes.${index}.activationStartDate`, "")
                                    setValue(`departmentMultiCodes.${index}.activationEndDate`, "")
                                  }
                                }}
                                onBlur={aField.onBlur}
                                placeholder="Select MultiCodes"
                                options={options}
                                isLoading={userDeptsQuery.isFetching}
                                disabled={!isAllowEnabled || !deptSelected}
                                onOpenChange={(open) => {
                                  if (open && Number(currentDeptId) > 0) {
                                    void fetchUserDeptsForRow(index)
                                  }
                                }}
                                className="!h-[40px] !min-h-[40px] py-1 shadow-sm"
                              />
                            )
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Activation Dates */}
                  {isAddMode ? (
                    /* Add Mode: always show Activation Start Date */
                    <div className="flex-1 flex flex-col">
                      <div className="h-[22px] mb-1 flex items-end">
                        <label className="text-[11px] font-normal text-[#374151] flex items-center gap-1">
                          <span>Activation Start Date</span>
                        </label>
                      </div>
                      <div className="h-[40px] flex items-center w-full">
                        <Controller
                          name={`departmentMultiCodes.${index}.activationStartDate`}
                          control={control}
                          render={({ field: sField }) => (
                            <DatePickerField
                              value={sField.value}
                              onChange={(val) => {
                                if (val && isActivationEndBeforeStart(val, watch(`departmentMultiCodes.${index}.activationEndDate`))) {
                                  toast.error(ACTIVATION_END_BEFORE_START_MSG)
                                  return
                                }
                                sField.onChange(val)
                              }}
                              disabled={!deptSelected || !isAllowEnabled || !hasSelectedMultiCodes || !deptAllowsActivationDates}
                            />
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Edit Mode: check deptAllowsActivationDates */
                    <>
                      {deptAllowsActivationDates ? (
                        <>
                          {/* Activation Start Date */}
                          <div className="flex-1 flex flex-col">
                            <div className="h-[22px] mb-1 flex items-end">
                              <label className="text-[11px] font-normal text-[#374151] flex items-center gap-1">
                                <span>Activation Start Date</span>
                              </label>
                            </div>
                            <div className="h-[40px] flex items-center w-full">
                              <Controller
                                name={`departmentMultiCodes.${index}.activationStartDate`}
                                control={control}
                                render={({ field: sField }) => (
                                  <DatePickerField
                                    value={sField.value}
                                    onChange={(val) => {
                                      if (val && isActivationEndBeforeStart(val, watch(`departmentMultiCodes.${index}.activationEndDate`))) {
                                        toast.error(ACTIVATION_END_BEFORE_START_MSG)
                                        return
                                      }
                                      sField.onChange(val)
                                    }}
                                    disabled={!deptSelected || !isAllowEnabled || !hasSelectedMultiCodes}
                                  />
                                )}
                              />
                            </div>
                          </div>

                          {/* Activation End Date */}
                          <div className="flex-1 flex flex-col">
                            <div className="h-[22px] mb-1 flex items-end">
                              <label className="block text-[11px] font-normal text-[#374151]">Activation End Date</label>
                            </div>
                            <div className="h-[40px] flex items-center w-full">
                              <Controller
                                name={`departmentMultiCodes.${index}.activationEndDate`}
                                control={control}
                                render={({ field: eField }) => (
                                  <DatePickerField
                                    value={eField.value}
                                    onChange={(val) => {
                                      if (val && isActivationEndBeforeStart(watch(`departmentMultiCodes.${index}.activationStartDate`), val)) {
                                        toast.error(ACTIVATION_END_BEFORE_START_MSG)
                                        return
                                      }
                                      eField.onChange(val)
                                    }}
                                    disabled={isAllowEnabled}
                                  />
                                )}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Keep grid alignment when dept does not allow activation dates */}
                          <div className="flex-1 flex flex-col pointer-events-none opacity-0" />
                          <div className="flex-1 flex flex-col pointer-events-none opacity-0" />
                        </>
                      )}
                    </>
                  )}
                  
                  {/* Delete Button */}
                  <div className="w-10 flex flex-col flex-shrink-0 mt-[26px]">
                    <button 
                      type="button" 
                      disabled={multiCodeFields.length <= 1}
                      onClick={() => {
                        if (multiCodeFields.length > 1) {
                          removeMultiCode(index)
                        }
                      }}
                      className={`flex size-10 flex-shrink-0 items-center justify-center transition-colors ${
                        multiCodeFields.length <= 1 
                          ? "text-[#c2c6d1] cursor-not-allowed opacity-50" 
                          : "text-red-500 hover:text-red-600 cursor-pointer"
                      }`}
                      title="Remove row"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                </div> 
              )
            })
          })()}
        </div>
      </div>
      ) : null}
        </>
      )}
    </div>
  )
}
