import { useMemo, useState } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { UserPagination } from "../components/UserPagination"
import { UserTable } from "../components/UserTable"
import { UserToolbar } from "../components/UserToolbar"
import { useUserModule } from "../hooks/useUserModule"
import { UserFormPage } from "./UserFormPage"
import {
  type UserModuleFormMode,
  type UserModuleFormValues,
  type UserModuleRow,
} from "../types"

const pageSize = 10

const emptyFormValues: UserModuleFormValues = {
  employeeNo: "",
  positionNo: "",
  location: "Susanville",
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
  roleAssignments: ["User"],
  supervisorPrimary: "",
  supervisorSecondary: "",
  tsMinDay: "480",
  programs: true,
  activities: true,
  supervisorApportioning: false,
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
      "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[11px] !whitespace-nowrap !text-[#111827] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
  }

  const [inactiveOnly, setInactiveOnly] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<UserModuleFormMode>("add")
  const [selectedRow, setSelectedRow] = useState<UserModuleRow | null>(null)
  const [formSessionId, setFormSessionId] = useState(0)

  const userModule = useUserModule({
    page,
    pageSize,
    inactiveOnly,
  })
  const isTableLoading = userModule.isLoading

  const formInitialValues = useMemo<UserModuleFormValues>(() => {
    if (formMode === "edit" && selectedRow) {
      return {
        employeeNo: selectedRow.employeeNo ?? selectedRow.id,
        positionNo: selectedRow.positionNo ?? "",
        location: selectedRow.location ?? "Susanville",
        firstName: selectedRow.firstName ?? selectedRow.employee.split(" ")[0] ?? "",
        lastName:
          selectedRow.lastName ?? selectedRow.employee.split(" ").slice(1).join(" "),
        phone: selectedRow.phone ?? "",
        loginId: selectedRow.loginId ?? "",
        password: selectedRow.password ?? "",
        confirmPassword: selectedRow.password ?? "",
        emailAddress: selectedRow.emailAddress ?? "",
        jobClassification: selectedRow.jobClassification ?? "",
        jobDutyStatement: "",
        claimingUnit: selectedRow.claimingUnit ?? selectedRow.department,
        spmp: selectedRow.spmp,
        multilingual: selectedRow.multilingual ?? false,
        allowMultiCodes:
          selectedRow.allowMultiCodes ?? selectedRow.multicodesEnabled,
        active: selectedRow.active,
        pkiUser: selectedRow.pkiUser ?? false,
        roleAssignments: selectedRow.roleAssignments ?? ["User"],
        supervisorPrimary: selectedRow.supervisorPrimary ?? "",
        supervisorSecondary: selectedRow.supervisorSecondary ?? "",
        tsMinDay: selectedRow.tsMinDay ?? "480",
        programs: selectedRow.programs ?? true,
        activities: selectedRow.activities ?? true,
        supervisorApportioning: selectedRow.supervisorApportioning ?? false,
        assignedMultiCodes: selectedRow.assignedMultiCodes ?? "",
      }
    }
    return emptyFormValues
  }, [formMode, selectedRow])

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
    setFormSessionId((prev) => prev + 1)
    setShowForm(true)
  }

  const handleEditRow = (row: UserModuleRow) => {
    setFormMode("edit")
    setSelectedRow(row)
    setFormSessionId((prev) => prev + 1)
    setShowForm(true)
  }

  const handleSaveForm = (values: UserModuleFormValues) => {
    if (formMode === "edit" && selectedRow) {
      userModule.updateRow(
        { id: selectedRow.id, values },
        {
          onSuccess: () => {
            toast.success("User Saved Successfully", successToastOptions)
            setShowForm(false)
          },
          onError: (error) => toast.error(error.message),
        }
      )
      return
    }

    userModule.createRow(
      { values },
      {
        onSuccess: () => {
          toast.success("Employee created successfully", successToastOptions)
          setShowForm(false)
        },
        onError: (error) => toast.error(error.message),
      }
    )
  }

  return (
    <section
      className="ieba-roboto w-full"
      style={{
        zoom: 1.2,
        "--primary": "#6C5DD3",
      } as React.CSSProperties}
    >
      {showForm ? (
        <UserFormPage
          key={formSessionId}
          mode={formMode}
          initialValues={formInitialValues}
          onCancel={() => setShowForm(false)}
          onSave={handleSaveForm}
        />
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
            <UserPagination
              totalItems={searchTerm.trim() ? filteredRows.length : userModule.totalItems}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </section>
  )
}
