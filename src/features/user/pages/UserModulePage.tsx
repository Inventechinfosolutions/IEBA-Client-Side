import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Check, X } from "lucide-react"
import { toast } from "sonner"

import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import { queryClient } from "@/main"
import { useAuth } from "@/contexts/AuthContext"
import { getToken, setToken } from "@/lib/api"
import { useGetDepartments } from "@/features/department/queries/getDepartments"
import { UserTable } from "../components/UserTable"
import { UserToolbar } from "../components/UserToolbar"
import { usePermissions } from "@/hooks/usePermissions"
import {
  assignUserDepartmentRoles,
  fetchDepartmentRolesCatalog,
  apiUploadUserDocument,
} from "../add-employee/api"
import { resolveAssignedSnapshotsForSecuritySave } from "../add-employee/utility/parseSecurityDepartmentRoles"
import { persistSecurityApportioningOnSave } from "../add-employee/utility/persistSecurityApportioningOnSave"
import {
  invalidateUserTabCaches,
  refetchFormAfterTabSave,
} from "../add-employee/utility/refetchFormAfterTabSave"
import { parseMultiSelectStoredValues } from "@/components/ui/multi-select-dropdown"
import { apiGetUserDetails } from "../api"
import { useUserModule } from "../hooks/useUserModule"
import { userModuleKeys } from "../keys"
import { AddEmployeeFormPage } from "../add-employee"
import {
  isGlobalAdminLogin,
  useMimicSession,
  useMimicUser,
} from "../user-mimic"
import { mimicKeys } from "../user-mimic/keys"
import { setStoredMimicSession } from "../user-mimic/storage"
import {
  type AddEmployeeSavePayload,
  type AddEmployeeSaveSync,
  type UserModuleFormMode,
  type UserModuleFormValues,
  type UserModuleRow,
} from "../types"

const emptyFormValues: UserModuleFormValues = {
  employeeNo: "",
  positionNo: "",
  locationId: undefined,
  location: "",
  firstName: "",
  lastName: "",
  phone: "",
  loginId: "",
  password: "",
  confirmPassword: "",
  emailAddress: "",
  jobClassificationIds: [],
  jobDutyStatement: "",
  claimingUnit: "",
  spmp: false,
  multilingual: false,
  allowMultiCodes: false,
  active: true,
  pkiUser: false,
  roleAssignments: [],
  securityAssignedSnapshots: [],
  supervisorPrimary: "",
  supervisorSecondary: "",
  supervisorPrimaryId: "",
  supervisorSecondaryId: "",
  tsMinDay: "480",
  programs: true,
  activities: true,
  supervisorApportioning: false,
  clientAdmin: false,
  assignedMultiCodes: "",
  copyUser: false,
  copyUserId: "",
  apportioningAllocations: {},
}

export function UserModulePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, establishDashboardSession } = useAuth()
  const isGlobalAdmin = isGlobalAdminLogin(user)
  const { data: mimicSession } = useMimicSession()
  const mimicMutation = useMimicUser()

  const successToastOptions = {
    position: "top-center" as const,
    icon: (
      <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
        <Check className="size-3 stroke-3" />
      </span>
    ),
    className:
      "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !text-[#111827] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
  }

  const mimicErrorToastOptions = {
    position: "top-center" as const,
    icon: (
      <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#ef4444] text-white">
        <X className="size-3 stroke-3" />
      </span>
    ),
    className:
      "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !text-[#111827] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
  }

  const [inactiveOnly, setInactiveOnly] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<UserModuleFormMode>("add")

  const { isSuperAdmin, isDepartmentAdmin, isTimeStudySupervisor, assignedDepartmentIds } = usePermissions()

  // Only SuperAdmin needs the full department list from the API.
  // All other roles use their assigned departments from the auth context.
  const { data: allDepartmentsData } = useGetDepartments(
    { status: "active", page: 1, limit: 1000 },
    { enabled: isSuperAdmin }
  )

  const allowedDepartments = useMemo(() => {
    // SuperAdmin: show all departments fetched from API
    if (isSuperAdmin && allDepartmentsData?.items) {
      return allDepartmentsData.items.map((d: any) => ({ id: Number(d.id), name: d.name }))
    }
    // All other roles: restrict to only departments assigned to this user
    if (user?.departmentRoles) {
      const map = new Map<number, string>()
      user.departmentRoles.forEach(dr => {
        if (dr.departmentId) {
          map.set(dr.departmentId, dr.departmentName)
        }
      })
      return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
    }
    return []
  }, [isSuperAdmin, allDepartmentsData, user])

  // Reset to table view on navigation (e.g. sidebar click)
  const [lastLocationKey, setLastLocationKey] = useState(location.key)
  if (lastLocationKey !== location.key) {
    setLastLocationKey(location.key)
    setShowForm(false)
  }
  const [selectedRow, setSelectedRow] = useState<UserModuleRow | null>(null)
  const [formSessionId, setFormSessionId] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  /** After first successful create in the add wizard, further saves use PUT /users/:id. */
  const [draftUserId, setDraftUserId] = useState<string | null>(null)

  const searchFilters = useMemo(() => {
    const raw = searchTerm.trim()
    if (!raw) return { firstName: "", lastName: "", name: "", employeeId: "" }
    const normalized = raw.replace(/\s+/g, " ")
    if (/^\d+$/.test(normalized)) {
      return { firstName: "", lastName: "", name: "", employeeId: normalized }
    }
    // We send everything as the full name to search on the backed `name` column
    return { firstName: "", lastName: "", name: normalized, employeeId: "" }
  }, [searchTerm])

  const userModule = useUserModule({
    page,
    pageSize,
    inactiveOnly,
    firstName: searchFilters.firstName || undefined,
    lastName: searchFilters.lastName || undefined,
    name: searchFilters.name || undefined,
    employeeId: searchFilters.employeeId || undefined,
    // SuperAdmin sees all users; all other roles are scoped to their assigned departments.
    // selectedDepartmentId (toolbar picker) takes priority when explicitly chosen.
    departmentId: selectedDepartmentId
      ? String(selectedDepartmentId)
      : (!isSuperAdmin && assignedDepartmentIds.length > 0
          ? assignedDepartmentIds.join(",")
          : undefined),
  }, { enabled: !showForm })
  const isTableLoading = userModule.isLoading

  /** Baseline from the list row (sparse); merged with GET /users/:id/details when editing. */
  const formValuesFromListRow = useMemo((): UserModuleFormValues | null => {
    if (formMode !== "edit" || !selectedRow) return null
    const nameParts = (selectedRow.employee ?? "").trim().split(/\s+/).filter(Boolean)
    const fromEmployeeFirst = nameParts[0] ?? ""
    const fromEmployeeRest = nameParts.slice(1).join(" ")
    return {
      employeeNo: selectedRow.employeeNo ?? selectedRow.id,
      positionNo: selectedRow.positionNo ?? "",
      locationId: undefined,
      location: selectedRow.location ?? "",
      firstName: selectedRow.firstName ?? fromEmployeeFirst,
      lastName: selectedRow.lastName ?? fromEmployeeRest,
      phone: selectedRow.phone ?? "",
      loginId: selectedRow.loginId ?? "",
      password: "",
      confirmPassword: "",
      emailAddress:
        (selectedRow.loginId ?? selectedRow.emailAddress ?? "").trim(),
      jobClassificationIds: [],
      jobDutyStatement: "",
      apportioningAllocations: {},
      claimingUnit: selectedRow.claimingUnit ?? selectedRow.department ?? "",
      spmp: selectedRow.spmp,
      multilingual: selectedRow.multilingual ?? false,
      allowMultiCodes:
        selectedRow.allowMultiCodes ?? selectedRow.multicodesEnabled,
      active: selectedRow.active,
      pkiUser: selectedRow.pkiUser ?? false,
      roleAssignments: selectedRow.roleAssignments ?? [],
      securityAssignedSnapshots: [],
      supervisorPrimary: selectedRow.supervisorPrimary ?? "",
      supervisorSecondary: selectedRow.supervisorSecondary ?? "",
      supervisorPrimaryId: selectedRow.supervisorPrimaryId ?? "",
      supervisorSecondaryId: selectedRow.supervisorSecondaryId ?? "",
      tsMinDay: selectedRow.tsMinDay ?? "480",
      programs: selectedRow.programs ?? true,
      activities: selectedRow.activities ?? true,
      supervisorApportioning: selectedRow.supervisorApportioning ?? false,
      clientAdmin: selectedRow.clientAdmin ?? false,
      assignedMultiCodes: selectedRow.assignedMultiCodes ?? "",
      copyUser: false,
      copyUserId: "",
    }
  }, [formMode, selectedRow])

  const formInitialValues = useMemo<UserModuleFormValues>(() => {
    if (formMode === "add") return emptyFormValues
    if (!formValuesFromListRow) return emptyFormValues
    return formValuesFromListRow
  }, [formMode, formValuesFromListRow])



  /** Omit detail `dataUpdatedAt` so edit save + refetch does not remount the form (keeps active tab). */
  const addEmployeeFormKey =
    formMode === "edit" && selectedRow
      ? `${formSessionId}-edit-${selectedRow.id}`
      : `${formSessionId}-add`

  const employeeSuggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return []

    const uniqueNames = new Set<string>()
    for (const row of userModule.rows) {
      const name = row.employee.trim()
      if (!name || uniqueNames.has(name)) continue
      if (name.toLowerCase().includes(query)) {
        uniqueNames.add(name)
      }
    }

    return Array.from(uniqueNames)
  }, [searchTerm, userModule.rows])

  const filteredRows = useMemo(() => {
    let currentRows = userModule.rows;
    // Apply supervisor filter on user table
    const isOnlySupervisor = isTimeStudySupervisor && !isSuperAdmin && !isDepartmentAdmin;
    if (isOnlySupervisor && user?.id) {
      currentRows = currentRows.filter(
        (r) => r.supervisorPrimaryId === user.id || r.supervisorSecondaryId === user.id
      );
    }
    return currentRows;
  }, [userModule.rows, isTimeStudySupervisor, isSuperAdmin, isDepartmentAdmin, user?.id]);


  const handleAddEmployee = () => {
    setFormMode("add")
    setSelectedRow(null)
    setDraftUserId(null)
    setFormSessionId((prev) => prev + 1)
    setShowForm(true)
  }

  const handleEditRow = (row: UserModuleRow) => {
    void queryClient.removeQueries({ queryKey: userModuleKeys.detail(row.id) })
    setFormMode("edit")
    setSelectedRow(row)
    setFormSessionId((prev) => prev + 1)
    setShowForm(true)
  }

  const handleSwitchUser = async (row: UserModuleRow) => {
    if (!isGlobalAdmin) return
    if (!user) return
    if (mimicSession) return
    const originalToken = (getToken() ?? "").trim()
    if (!originalToken) return
    try {
      const result = await mimicMutation.mutateAsync({ targetUserId: row.id })
      setToken(result.accessToken)
      const details = await apiGetUserDetails(result.userId)
      const nextRoles = details.roles?.map((r) => r.name) ?? []
      const deptRoles = details.departmentsRoles?.map((dr) => ({
        departmentId: dr.departmentId,
        roleId: dr.roleId,
        departmentName: dr.department?.name ?? "",
        roleName: dr.role?.name ?? "",
      }))
      let nextPerms = details.allpermissions ?? []
      if (!nextPerms || nextPerms.length === 0) {
        const all = new Set<string>()
        details.departmentsRoles?.forEach((dr) => {
          dr.permissions?.forEach((p) => all.add(p))
        })
        nextPerms = Array.from(all)
      }
      const displayName =
        (details.name ?? "").trim() ||
        `${details.firstName ?? ""} ${details.lastName ?? ""}`.trim() ||
        row.employee?.trim() ||
        row.loginId ||
        result.userId
      establishDashboardSession({
        id: result.userId,
        name: displayName,
        email: details.user?.loginId?.trim() || row.loginId || row.emailAddress || "",
        namespace: user.namespace,
        countyName: user.countyName,
        avatar: user.avatar,
        roles: nextRoles,
        permissions: nextPerms,
        departmentRoles: deptRoles,
      })
      setStoredMimicSession({
        originalToken,
        originalUser: user,
        targetUserId: row.id,
        targetDisplayName: displayName,
        targetLoginId: details.user?.loginId?.trim() || row.loginId || undefined,
      })
      queryClient.setQueryData(mimicKeys.all, {
        originalToken,
        originalUser: user,
        targetUserId: row.id,
        targetDisplayName: displayName,
        targetLoginId: details.user?.loginId?.trim() || row.loginId || undefined,
      })
      queryClient.clear()
      navigate("/", { replace: true })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to mimic user. Please try again."
      toast.error(message, mimicErrorToastOptions)
    }
  }

  const handleSaveForm = async ({
    values,
    sourceTab,
  }: AddEmployeeSavePayload): Promise<AddEmployeeSaveSync | void> => {
    setIsSaving(true)

    // 1. Validation for Supervisor Apportioning Total Percentage (must be exactly 100%)
    if (sourceTab === "security" && values.supervisorApportioning) {
      const saveUserId =
        formMode === "edit" && selectedRow ? selectedRow.id : draftUserId ?? ""
      const snapshotsForSave = saveUserId
        ? resolveAssignedSnapshotsForSecuritySave(saveUserId, values.securityAssignedSnapshots ?? [])
        : (values.securityAssignedSnapshots ?? [])
      const assignedDeptIds = new Set(snapshotsForSave.map((s) => String(s.departmentId)))
      const allocations = Object.entries(values.apportioningAllocations ?? {})
        .filter(([id]) => assignedDeptIds.has(id))
        .map(([, val]) => parseFloat(val ?? "") || 0)

      const total = allocations.reduce((sum, val) => sum + val, 0)

      if (total > 100) {
        toast.error("Allocation percentage should not exceed 100%")
        return
      }
      if (total < 100) {
        toast.error("Allocation percentage must be exactly 100%")
        return
      }
    }

    try {
      if (formMode === "edit" && selectedRow) {
        if (sourceTab === "security") {
          await persistSecurityApportioningOnSave(selectedRow.id, values)
        }

        await userModule.updateRowAsync({ id: selectedRow.id, values })
        toast.success("User Saved Successfully", successToastOptions)
        invalidateUserTabCaches(queryClient, selectedRow.id, sourceTab)
        const merged = await refetchFormAfterTabSave(
          queryClient,
          selectedRow.id,
          sourceTab,
          values,
        )
        return { formValues: merged }
      }

      if (draftUserId) {
        if (sourceTab === "security") {
          await persistSecurityApportioningOnSave(draftUserId, values)
        }
        await userModule.updateRowAsync({ id: draftUserId, values })
        toast.success("Employee saved successfully", successToastOptions)
        invalidateUserTabCaches(queryClient, draftUserId, sourceTab)
        const merged = await refetchFormAfterTabSave(queryClient, draftUserId, sourceTab, values)
        return { formValues: merged }
      }

      const created = await userModule.createRowAsync({ values })
      setDraftUserId(created.id)
      toast.success(
        "Employee details saved. You can go to the next tab without saving again.",
        successToastOptions,
      )

      if (values.jobDutyFile) {
        try {
          await apiUploadUserDocument(created.id, "job_duty", values.jobDutyFile)
        } catch (uploadError) {
          console.error("Job Duty Statement upload failed during create:", uploadError)
          toast.error("User created, but Job Duty Statement upload failed.")
        }
      }

      if (values.autoAssignedDepartments?.trim()) {
        try {
          const deptIds = parseMultiSelectStoredValues(values.autoAssignedDepartments)
          if (deptIds.length > 0) {
            const rolesCatalog = await fetchDepartmentRolesCatalog()
            
            // Build the payload dynamically ensuring we use the exact departmentrole ID mapped to each dept
            const mappedDepartments = deptIds
              .map(idStr => {
                const deptIdNum = Number(idStr);
                const matchingRole = rolesCatalog.find(
                  r => r.id.startsWith(`${deptIdNum}-`) && r.name.toLowerCase() === "user"
                );
                if (matchingRole) {
                   const roleId = matchingRole.id.split("-").pop();
                   if (roleId) return { id: deptIdNum, roles: [{ id: roleId }] };
                }
                return null;
              })
              .filter((d): d is { id: number, roles: { id: string }[] } => d !== null);

            if (mappedDepartments.length > 0) {
              await assignUserDepartmentRoles({
                userId: created.id,
                departments: mappedDepartments
              })
            }
          }
        } catch (autoAssignError) {
           toast.error(autoAssignError instanceof Error ? autoAssignError.message : "Failed to auto-assign departments.")
           // Continue to show success for user creation
        }
      }
      toast.success(
        "Employee details saved. You can go to the next tab without saving again.",
        successToastOptions
      )
      invalidateUserTabCaches(queryClient, created.id, sourceTab)
      const merged = await refetchFormAfterTabSave(queryClient, created.id, sourceTab, values)
      return { formValues: merged }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed"
      toast.error(message)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section
      key={location.key}
      className="font-roboto *:font-roboto w-full"
      style={{
        zoom: 1.2,
        "--primary": "#6C5DD3",
      } as React.CSSProperties}
    >
      {showForm ? (
        <AddEmployeeFormPage
          key={addEmployeeFormKey}
          mode={formMode}
          initialValues={formInitialValues}
          securityContextUserId={
            formMode === "edit" && selectedRow ? selectedRow.id : draftUserId ?? null
          }
          onCancel={() => {
            setDraftUserId(null)
            setShowForm(false)
            void queryClient.invalidateQueries({ queryKey: userModuleKeys.lists() })
          }}
          onSave={handleSaveForm}
          isSubmitting={isSaving || userModule.isCreating || userModule.isUpdating}
        />
      ) : (
        <div className="">
          <UserToolbar
            inactiveOnly={inactiveOnly}
            searchTerm={searchTerm}
            suggestions={employeeSuggestions}
            onToggleInactiveOnly={() => setInactiveOnly((prev) => !prev)}
            onSearchChange={(value) => {
              setSearchTerm(value)
              setPage(1)
            }}
            onSelectSuggestion={(value) => {
              setSearchTerm(value)
              setPage(1)
            }}
            departmentId={selectedDepartmentId}
            allowedDepartments={allowedDepartments}
            onDepartmentChange={(val) => {
              setSelectedDepartmentId(val)
              setPage(1)
            }}
            onAddEmployee={handleAddEmployee}
          />
          <div className="rounded-[8px] bg-white p-3">
            <div className="mb-5">
              <UserTable
                rows={filteredRows}
                isLoading={isTableLoading}
                onEditRow={handleEditRow}
                onSwitchUser={isGlobalAdmin && !mimicSession ? handleSwitchUser : undefined}
              />
            </div>
            <MasterCodePagination
              totalItems={userModule.totalItems}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={(p: number) => setPage(p)}
              onPageSizeChange={(newSize: number) => {
                setPageSize(newSize)
                setPage(1)
              }}
            />
          </div>
        </div>
      )}
    </section>
  )
}

export default UserModulePage

