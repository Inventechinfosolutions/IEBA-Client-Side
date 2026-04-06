import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import { queryClient } from "@/main"
import { UserTable } from "../components/UserTable"
import { UserToolbar } from "../components/UserToolbar"
import { apiGetUserDetails } from "../api"
import { useUserModule } from "../hooks/useUserModule"
import { userModuleKeys } from "../keys"
import { mergeUserDetailsIntoFormValues } from "../utility/mapUserDetailsToForm"
import { AddEmployeeFormPage } from "../add-employee"
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
  jobClassification: "",
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
}

export function UserModulePage() {
  const successToastOptions = {
    position: "top-center" as const,
    icon: (
      <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
        <Check className="size-3 stroke-[3]" />
      </span>
    ),
    className:
      "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !text-[#111827] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
  }

  const [inactiveOnly, setInactiveOnly] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<UserModuleFormMode>("add")
  const [selectedRow, setSelectedRow] = useState<UserModuleRow | null>(null)
  const [formSessionId, setFormSessionId] = useState(0)
  /** After first successful create in the add wizard, further saves use PUT /users/:id. */
  const [draftUserId, setDraftUserId] = useState<string | null>(null)

  const userModule = useUserModule({
    page,
    pageSize,
    inactiveOnly,
  })
  const isTableLoading = userModule.isLoading

  const shouldFetchEditDetails =
    showForm && formMode === "edit" && selectedRow != null

  const editUserDetailsQuery = useQuery({
    queryKey: userModuleKeys.detail(selectedRow?.id ?? ""),
    queryFn: () => apiGetUserDetails(selectedRow!.id),
    enabled: shouldFetchEditDetails,
    retry: 1,
  })

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
      jobClassification: selectedRow.jobClassification ?? "",
      jobDutyStatement: "",
      claimingUnit: selectedRow.claimingUnit ?? selectedRow.department,
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
    }
  }, [formMode, selectedRow])

  const formInitialValues = useMemo<UserModuleFormValues>(() => {
    if (formMode === "add") return emptyFormValues
    if (!formValuesFromListRow) return emptyFormValues
    if (editUserDetailsQuery.data) {
      return mergeUserDetailsIntoFormValues(
        editUserDetailsQuery.data,
        formValuesFromListRow,
      )
    }
    return formValuesFromListRow
  }, [formMode, formValuesFromListRow, editUserDetailsQuery.data])

  const editFormReady =
    formMode !== "edit" ||
    !selectedRow ||
    editUserDetailsQuery.isSuccess ||
    editUserDetailsQuery.isError

  /** Omit detail `dataUpdatedAt` so edit save + refetch does not remount the form (keeps active tab). */
  const addEmployeeFormKey =
    formMode === "edit" && selectedRow
      ? `${formSessionId}-edit-${selectedRow.id}`
      : `${formSessionId}-add`

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return userModule.rows

    return userModule.rows.filter((row) =>
      row.employee.toLowerCase().includes(query)
    )
  }, [searchTerm, userModule.rows])
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

  const handleAddEmployee = () => {
    setFormMode("add")
    setSelectedRow(null)
    setDraftUserId(null)
    setFormSessionId((prev) => prev + 1)
    setShowForm(true)
  }

  const handleEditRow = (row: UserModuleRow) => {
    setFormMode("edit")
    setSelectedRow(row)
    setFormSessionId((prev) => prev + 1)
    setShowForm(true)
  }

  const handleSaveForm = async ({
    values,
    sourceTab: _sourceTab,
  }: AddEmployeeSavePayload): Promise<AddEmployeeSaveSync | void> => {
    try {
      if (formMode === "edit" && selectedRow) {
        await userModule.updateRowAsync({ id: selectedRow.id, values })
        toast.success("User Saved Successfully", successToastOptions)
        try {
          const details = await apiGetUserDetails(selectedRow.id)
          queryClient.setQueryData(userModuleKeys.detail(selectedRow.id), details)
          const merged = mergeUserDetailsIntoFormValues(details, values)
          return { formValues: merged }
        } catch {
          void queryClient.invalidateQueries({ queryKey: userModuleKeys.detail(selectedRow.id) })
          return { formValues: values }
        }
      }

      if (draftUserId) {
        await userModule.updateRowAsync({ id: draftUserId, values })
        toast.success("Employee saved successfully", successToastOptions)
        try {
          const details = await apiGetUserDetails(draftUserId)
          const merged = mergeUserDetailsIntoFormValues(details, values)
          return { formValues: merged }
        } catch {
          const login = (values.loginId ?? "").trim()
          const fallback: UserModuleFormValues = {
            ...values,
            loginId: login,
            emailAddress: login,
          }
          return { formValues: fallback }
        }
      }

      const created = await userModule.createRowAsync({ values })
      setDraftUserId(created.id)
      toast.success(
        "Employee details saved. You can go to the next tab without saving again.",
        successToastOptions
      )
      try {
        const details = await apiGetUserDetails(created.id)
        const merged = mergeUserDetailsIntoFormValues(details, values)
        return { formValues: merged }
      } catch {
        const login = (created.loginId ?? values.loginId).trim()
        return {
          formValues: {
            ...values,
            loginId: login,
            emailAddress: login,
          },
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed"
      toast.error(message)
      throw error
    }
  }

  return (
    <section
      className="font-roboto *:font-roboto w-full"
      style={{
        zoom: 1.2,
        "--primary": "#6C5DD3",
      } as React.CSSProperties}
    >
      {showForm ? (
        shouldFetchEditDetails && editUserDetailsQuery.isPending ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[8px] border border-[#d8dce8] bg-white">
            <Loader2 className="size-10 animate-spin text-[#6C5DD3]" aria-hidden />
            <p className="text-[13px] text-[#374151]">Loading user details…</p>
          </div>
        ) : shouldFetchEditDetails && editUserDetailsQuery.isError ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[8px] border border-[#d8dce8] bg-white px-6 text-center">
            <p className="max-w-md text-[13px] text-[#374151]">
              Could not load this user&apos;s full profile. Job classification and other fields need this
              data before you can save.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                className="h-9 rounded-[8px] bg-[#6C5DD3] px-4 text-[12px] text-white hover:bg-[#6C5DD3]"
                onClick={() => void editUserDetailsQuery.refetch()}
              >
                Retry
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-[8px] px-4 text-[12px]"
                onClick={() => {
                  setShowForm(false)
                  void queryClient.invalidateQueries({ queryKey: userModuleKeys.lists() })
                }}
              >
                Back to list
              </Button>
            </div>
          </div>
        ) : editFormReady ? (
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
          />
        ) : null
      ) : (
        <div className="rounded-[10px] border border-[#e6e7ef] bg-gray-100 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] md:p-5">
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
            onAddEmployee={handleAddEmployee}
          />
          <div className="rounded-[8px] bg-white p-3">
            <div className="mb-5">
              <UserTable
                rows={filteredRows}
                isLoading={isTableLoading}
                onEditRow={handleEditRow}
              />
            </div>
            <MasterCodePagination
              totalItems={searchTerm.trim() ? filteredRows.length : userModule.totalItems}
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
