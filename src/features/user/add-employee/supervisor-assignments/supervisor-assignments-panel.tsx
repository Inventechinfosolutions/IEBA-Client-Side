import { useMemo, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { SingleSelectDropdown } from "@/components/ui/dropdown"

import { supervisorPickerDisplayName } from "../api"
import type {
  AddEmployeeDepartmentSupervisorRow,
  SupervisorMenuOpen,
  SupervisorPickerOption,
  UserModuleFormValues,
} from "../types"

import {
  useGetAddEmployeeDepartments,
  useGetSupervisorsByDepartments,
} from "../queries/get-add-employee"

function dedupeSupervisorRowsFromApi(rows: AddEmployeeDepartmentSupervisorRow[]): SupervisorPickerOption[] {
  const byId = new Map<string, string>()
  for (const r of rows) {
    const id = r.id?.trim()
    if (!id) continue
    const label = supervisorPickerDisplayName(r).trim()
    if (!label) continue
    if (!byId.has(id)) byId.set(id, label)
  }
  return [...byId.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
}

/** Include supervisors from GET /details (form fields) when the dept-based list is empty or omits them. */
function coerceDepartmentIdForSupervisorsApi(id: string | number): number | null {
  if (typeof id === "number" && Number.isInteger(id) && id >= 1) return id
  const n = typeof id === "string" ? Number.parseInt(id, 10) : Number.NaN
  if (Number.isInteger(n) && n >= 1) return n
  return null
}

function mergeSupervisorCatalog(
  apiOptions: SupervisorPickerOption[],
  ...fromForm: { id: string; label: string }[]
): SupervisorPickerOption[] {
  const byId = new Map<string, string>()
  for (const o of apiOptions) byId.set(o.id, o.label)
  for (const row of fromForm) {
    const id = row.id.trim()
    if (!id || byId.has(id)) continue
    const label = row.label.trim() || id
    byId.set(id, label)
  }
  return [...byId.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
}

const supervisorEmptyListSlot = (
  <div className="flex flex-col items-center justify-center rounded-[6px] border border-[#eceff5] bg-white px-3 py-4">
    <img src={tableEmptyIcon} alt="" className="h-[73px] w-[82px] object-contain" />
  </div>
)

/** UI tab: Supervisor Assignments */
export function SupervisorAssignmentsPanel() {
  const [menuOpen, setMenuOpen] = useState<SupervisorMenuOpen>(null)
  const { control, setValue, watch } = useFormContext<UserModuleFormValues>()
  const employeeName = `${watch("firstName") ?? ""} ${watch("lastName") ?? ""}`.trim()

  const snapshots = watch("securityAssignedSnapshots") ?? []
  const snapshotDepartmentIds = useMemo(
    () =>
      [...new Set(snapshots.map((s) => s.departmentId))].filter(
        (n): n is number => Number.isInteger(n) && n >= 1,
      ),
    [snapshots],
  )

  const departmentsCatalogQuery = useGetAddEmployeeDepartments()
  const catalogDepartmentIds = useMemo(() => {
    const rows = departmentsCatalogQuery.data ?? []
    const ids = rows
      .map((d) => coerceDepartmentIdForSupervisorsApi(d.id))
      .filter((n): n is number => n != null)
    return [...new Set(ids)]
  }, [departmentsCatalogQuery.data])

  /** Security snapshots drive the list when present; otherwise load supervisors across all departments (e.g. details with empty departmentsRoles). */
  const departmentIdsForSupervisors = useMemo(() => {
    if (snapshotDepartmentIds.length > 0) return snapshotDepartmentIds
    return catalogDepartmentIds
  }, [snapshotDepartmentIds, catalogDepartmentIds])

  const supervisorsFetchEnabled = departmentIdsForSupervisors.length > 0
  const supervisorsQuery = useGetSupervisorsByDepartments(
    departmentIdsForSupervisors,
    supervisorsFetchEnabled,
  )

  const awaitingDepartmentsForSupervisorFallback =
    snapshotDepartmentIds.length === 0 &&
    (departmentsCatalogQuery.isPending || departmentsCatalogQuery.isFetching)

  const isLoadingSupervisorOptions =
    awaitingDepartmentsForSupervisorFallback ||
    (supervisorsFetchEnabled && supervisorsQuery.isPending)

  const apiSupervisorOptions = useMemo((): SupervisorPickerOption[] => {
    if (!supervisorsFetchEnabled || !supervisorsQuery.data) return []
    return dedupeSupervisorRowsFromApi(supervisorsQuery.data)
  }, [supervisorsFetchEnabled, supervisorsQuery.data])

  const primarySupervisorId = (watch("supervisorPrimaryId") ?? "").trim()
  const secondarySupervisorId = (watch("supervisorSecondaryId") ?? "").trim()
  const supervisorPrimaryLabel = (watch("supervisorPrimary") ?? "").trim()
  const supervisorSecondaryLabel = (watch("supervisorSecondary") ?? "").trim()

  const catalogOptions = useMemo(
    () =>
      mergeSupervisorCatalog(
        apiSupervisorOptions,
        { id: primarySupervisorId, label: supervisorPrimaryLabel },
        { id: secondarySupervisorId, label: supervisorSecondaryLabel },
      ),
    [
      apiSupervisorOptions,
      primarySupervisorId,
      secondarySupervisorId,
      supervisorPrimaryLabel,
      supervisorSecondaryLabel,
    ],
  )

  const primaryVisible = useMemo(() => {
    const ex = secondarySupervisorId ? new Set([secondarySupervisorId]) : null
    if (!ex?.size) return catalogOptions
    return catalogOptions.filter((o) => !ex.has(o.id))
  }, [catalogOptions, secondarySupervisorId])

  const secondaryVisible = useMemo(() => {
    const ex = primarySupervisorId ? new Set([primarySupervisorId]) : null
    if (!ex?.size) return catalogOptions
    return catalogOptions.filter((o) => !ex.has(o.id))
  }, [catalogOptions, primarySupervisorId])

  const openChange = (which: "primary" | "secondary", open: boolean) => {
    if (open) setMenuOpen(which)
    else setMenuOpen((prev) => (prev === which ? null : prev))
  }

  const toSelectOptions = (opts: SupervisorPickerOption[]) =>
    opts.map((o) => ({ value: o.id, label: o.label, key: o.id }))

  return (
    <div className="pt-1">
      <p className="mb-5 select-none text-[12px] font-semibold uppercase text-[#111827]">{employeeName}</p>
      {supervisorsFetchEnabled && supervisorsQuery.isError ? (
        <p className="mb-3 text-[11px] text-red-500" role="alert">
          {supervisorsQuery.error instanceof Error
            ? supervisorsQuery.error.message
            : "Failed to load supervisors"}
        </p>
      ) : null}
      <div className="grid max-w-[620px] grid-cols-2 gap-2 pt-2">
        <Controller
          name="supervisorPrimaryId"
          control={control}
          render={({ field: idField }) => (
            <div>
              <p className="mb-0.5 block select-none text-[10px] font-medium text-[#2a2f3a]">
                Primary Supervisor
              </p>
              <SingleSelectDropdown
                value={(idField.value ?? "").trim()}
                onChange={(id) => {
                  idField.onChange(id)
                  const opt = primaryVisible.find((o) => o.id === id)
                  setValue("supervisorPrimary", opt?.label ?? "", {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }}
                onBlur={idField.onBlur}
                options={toSelectOptions(primaryVisible)}
                placeholder="Select Primary Supervisor"
                open={menuOpen === "primary"}
                onOpenChange={(open) => openChange("primary", open)}
                isLoading={isLoadingSupervisorOptions}
                contentClassName="max-h-[180px]"
                className="min-h-[46px] rounded-[7px] border-[#c6cedd] text-[11px] leading-[14px]"
                emptyListSlot={supervisorEmptyListSlot}
                emptyListMessage=""
                itemButtonClassName="rounded-[4px] px-2.5 py-1.5"
                itemLabelClassName="text-[11px] leading-[16px]"
              />
            </div>
          )}
        />
        <Controller
          name="supervisorSecondaryId"
          control={control}
          render={({ field: idField }) => (
            <div>
              <p className="mb-0.5 block select-none text-[10px] font-medium text-[#2a2f3a]">
                Backup Supervisor
              </p>
              <SingleSelectDropdown
                value={(idField.value ?? "").trim()}
                onChange={(id) => {
                  idField.onChange(id)
                  const opt = secondaryVisible.find((o) => o.id === id)
                  setValue("supervisorSecondary", opt?.label ?? "", {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }}
                onBlur={idField.onBlur}
                options={toSelectOptions(secondaryVisible)}
                placeholder="Select Backup Supervisor"
                open={menuOpen === "secondary"}
                onOpenChange={(open) => openChange("secondary", open)}
                isLoading={isLoadingSupervisorOptions}
                contentClassName="max-h-[180px]"
                className="min-h-[46px] rounded-[7px] border-[#c6cedd] text-[11px] leading-[14px]"
                emptyListSlot={supervisorEmptyListSlot}
                emptyListMessage=""
                itemButtonClassName="rounded-[4px] px-2.5 py-1.5"
                itemLabelClassName="text-[11px] leading-[16px]"
              />
            </div>
          )}
        />
      </div>
    </div>
  )
}
