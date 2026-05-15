import { lazy, Suspense, useCallback, useMemo, useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import { Controller, useFormContext } from "react-hook-form"
import { toast } from "sonner"

import { ArrowLeft, History } from "lucide-react"
import { queryClient } from "@/main"
import { fetchSecurityDepartmentRoles, fetchUserDetailsTab } from "../api"
import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { usePermissions } from "@/hooks/usePermissions"

import type {
  AddEmployeeSecurityRoleItem,
  SecurityAssignmentsPanelProps,
  UserModuleFormValues,
} from "../types"

import { addEmployeeTransferSuccessToastOptions } from "../schemas"
import { useAssignUserDepartmentRoles, useUnassignUserDepartmentRoles } from "../mutations/user-department-role-transfer"
import { useGetAllDepartments } from "@/features/department/queries/getDepartments"
import { addEmployeeLookupKeys } from "../keys"
import { useGetSecurityDepartmentRoles, useGetUserDetailsTab } from "../queries/get-add-employee"
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
  
  const {
    watch,
    control,
    setValue,
    getValues,
    formState: { dirtyFields },
  } = useFormContext<UserModuleFormValues>()

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

  /** Prefer GET /assignedDepartment/roles when loaded; form state for add-before-userId. */
  const assignedSnapshots = useMemo(() => {
    if (securityRolesData?.assignedSnapshots.length) {
      return securityRolesData.assignedSnapshots
    }
    return formSecuritySnapshots
  }, [securityRolesData, formSecuritySnapshots])
  
  const { isSuperAdmin, user } = usePermissions()
  // All non-super-admin roles are restricted to their assigned departments only
  const isRestrictedNonSuperAdmin = !isSuperAdmin

  const allowedDepartmentNames = useMemo(() => {
    if (!isRestrictedNonSuperAdmin || !user?.departmentRoles) return null
    return new Set(user.departmentRoles.map(dr => dr.departmentName))
  }, [isRestrictedNonSuperAdmin, user?.departmentRoles])

  /** GET /departments/all — department settings for Supervisor Apportioning (no pagination). */
  const departmentsQuery = useGetAllDepartments(
    { status: "active", sort: "ASC" },
    { enabled: assignedSnapshots.length > 0 },
  )

  const isApportioningEnabled = useMemo(() => {
    if (!departmentsQuery.data?.items || assignedSnapshots.length === 0) return false
    
    // Check if "Time Study Supervisor" role is assigned
    const hasTimeStudySupervisorRole = assignedSnapshots.some(s => s.name.trim() === "Time Study Supervisor")
    if (!hasTimeStudySupervisorRole) return false

    // Get unique department IDs from assigned snapshots
    const assignedDeptIds = new Set(assignedSnapshots.map(s => String(s.departmentId)))
    
    // Check if any of those departments has both settings enabled
    return departmentsQuery.data.items.some(dept => 
      assignedDeptIds.has(String(dept.id)) && 
      dept.settings.apportioning
    )
  }, [departmentsQuery.data?.items, assignedSnapshots])


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

    let dbSupervisorDepts = new Set<number>()

    // 1. Guard: Only allow unassign if the department's allocation is 0 or null IN THE DATABASE
    if (displaySupervisorApportioning && !isAddMode && securityUserId) {
      try {
        const tab2Raw =
          tab2Data ??
          parseUserDetailsTab2(
            (await queryClient.fetchQuery({
              queryKey: addEmployeeLookupKeys.userDetailsTab(securityUserId, "tab2"),
              queryFn: () => fetchUserDetailsTab(securityUserId, "tab2"),
              staleTime: 0,
            })) as Record<string, unknown>,
          )
        const details = tab2Raw

        const supervisorDbRoles =
          details.departmentsRoles?.filter((dr) => dr.role?.name?.trim() === "Time Study Supervisor") ?? []
        dbSupervisorDepts = new Set(supervisorDbRoles.map(dr => dr.departmentId));

        const supervisorItemsRemoving = toRemoveItems.filter(i => i.name.trim() === "Time Study Supervisor");
        const deptsRemovingIds = new Set(
          supervisorItemsRemoving
            .map(i => departmentIdFromSecurityCatalogItemId(i.id))
            .filter((id): id is number => id != null)
        );

        // If removing ALL supervisor roles at once, allow it!
        const isRemovingAllSupervisorRoles = deptsRemovingIds.size === dbSupervisorDepts.size && dbSupervisorDepts.size > 0;

        const failingItem = toRemoveItems.find((i) => {
          // Only check if we are specifically trying to unassign the Supervisor role
          if (i.name.trim() !== "Time Study Supervisor") return false

          const deptId = departmentIdFromSecurityCatalogItemId(i.id)
          if (deptId == null) return false
          
          // Exception 1: If removing ALL supervisor roles, allow it!
          if (isRemovingAllSupervisorRoles) return false

          // Exception 2: If this is the ONLY supervisor department, allow unassigning it
          // regardless of the current database percentage.
          if (dbSupervisorDepts.size <= 1) return false

          // Otherwise, if they have multiple departments, they must set this one to 0 first
          const deptRoles = details.departmentsRoles?.filter((dr) => dr.departmentId === deptId)
          const hasAllocation = deptRoles?.some((dr) => (dr.apportioning ?? 0) > 0)
          
          return hasAllocation
        })

        if (failingItem) {
          // Find departments that are staying
          const deptsStaying = supervisorDbRoles.filter(dr => !deptsRemovingIds.has(dr.departmentId));
          
          const deptId = departmentIdFromSecurityCatalogItemId(failingItem.id);
          const allRolesForThisDeptInDb =
            details.departmentsRoles?.filter((dr) => dr.departmentId === deptId) ?? []
          const rolesBeingRemovedForThisDept = toRemoveItems.filter(i => departmentIdFromSecurityCatalogItemId(i.id) === deptId);
          
          // Check if user is removing ALL roles they have in this department
          const isRemovingFullDepartment = allRolesForThisDeptInDb.length > 0 && 
            allRolesForThisDeptInDb.every(dbRole => 
              rolesBeingRemovedForThisDept.some(removingItem => {
                const removingRoleId = roleRefIdFromSecurityCatalogItemId(removingItem.id);
                return Number(removingRoleId) === Number(dbRole.roleId);
              })
            );

          let message = "";
          const stayingDeptName = deptsStaying.length === 1 ? (deptsStaying[0].department?.name || "the remaining department") : "";

          if (isRemovingFullDepartment) {
            message = `Cannot unassign ${failingItem.department} department.`;
          } else {
            message = `Cannot unassign ${failingItem.name} role from ${failingItem.department}.`;
          }

          if (deptsStaying.length === 1) {
            toast.error(`${message} Please make ${stayingDeptName} apportioning 100% and try again.`)
          } else {
            toast.error(`${message} Please update your allocations among remaining departments first.`)
          }
          return
        }
      } catch (err) {
        console.error("Failed to verify database allocations:", err)
        // Fallback to local check if API fails, or block for safety? 
        // Blocking is safer for business rules.
        toast.error("Could not verify department status. Please try again.")
        return
      }
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
        // If unassigning the last supervisor department, force apportioningRequired to false
        const isRemovingSupervisorRole = toRemoveItems.some(i => i.name.trim() === "Time Study Supervisor");
        const willHaveNoSupervisorDepts = 
          dbSupervisorDepts.size === 0 || 
          (dbSupervisorDepts.size === 1 && isRemovingSupervisorRole);

        await unassignMutation.mutateAsync({
          userId: securityUserId,
          departments,
          apportioningRequired: willHaveNoSupervisorDepts ? false : getValues("supervisorApportioning"),
          apportioningAllocation: [], // Role assignment only - do not update percentages
        })
        toast.success("Roles unassigned.", addEmployeeTransferSuccessToastOptions)
        await refetchSecurityRolesAndSyncForm()
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

                const assignedDepts = Array.from(deptsWithSupervisor)
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
        </>
      )}
    </div>
  )
}
