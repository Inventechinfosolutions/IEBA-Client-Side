import { useMemo, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"

import { Spinner } from "@/components/ui/spinner"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { SingleSelectDropdown } from "@/components/ui/dropdown"

import type {
  SupervisorMenuOpen,
  SupervisorPickerOption,
  SupervisorAssignmentsPanelProps,
  UserModuleFormValues,
} from "../types"

import { useGetUserDetailsTab } from "../queries/get-add-employee"
import {
  parseUserDetailsTab3,
  type UserDetailsTab3Dto,
} from "../utility/refetchFormAfterTabSave"

function supervisorOptionsFromTab3(tab3: UserDetailsTab3Dto): SupervisorPickerOption[] {
  const byId = new Map<string, string>()
  for (const row of tab3.supervisors ?? []) {
    const id = row.id?.trim()
    const label = row.name?.trim() || row.loginId?.trim() || ""
    if (!id || !label) continue
    if (!byId.has(id)) byId.set(id, label)
  }
  return [...byId.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
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

/** UI tab: Supervisor Assignments — GET /users/:id/details/required?method=tab3 only. */
export function SupervisorAssignmentsPanel({
  mode,
  supervisorContextUserId = null,
}: SupervisorAssignmentsPanelProps) {
  const isAddMode = mode === "add"
  const supervisorUserId = supervisorContextUserId?.trim() ?? ""
  const tab3Query = useGetUserDetailsTab(supervisorUserId, "tab3", Boolean(supervisorUserId))
  const tab3Data = useMemo(
    () => (tab3Query.data ? parseUserDetailsTab3(tab3Query.data) : undefined),
    [tab3Query.data],
  )

  const [menuOpen, setMenuOpen] = useState<SupervisorMenuOpen>(null)
  const { control, setValue, watch } = useFormContext<UserModuleFormValues>()

  const firstName = watch("firstName")
  const lastName = watch("lastName")
  const employeeName =
    `${firstName ?? tab3Data?.firstName ?? ""} ${lastName ?? tab3Data?.lastName ?? ""}`.trim() ||
    tab3Data?.name?.trim() ||
    ""

  const formPrimaryId = (watch("supervisorPrimaryId") ?? "").trim()
  const formSecondaryId = (watch("supervisorSecondaryId") ?? "").trim()
  const formPrimaryLabel = (watch("supervisorPrimary") ?? "").trim()
  const formSecondaryLabel = (watch("supervisorSecondary") ?? "").trim()

  const effectivePrimaryId = formPrimaryId || tab3Data?.primarySupervisor?.id?.trim() || ""
  const effectiveSecondaryId = formSecondaryId || tab3Data?.backupSupervisor?.id?.trim() || ""
  const effectivePrimaryLabel =
    formPrimaryLabel || tab3Data?.primarySupervisor?.name?.trim() || ""
  const effectiveSecondaryLabel =
    formSecondaryLabel || tab3Data?.backupSupervisor?.name?.trim() || ""

  const apiSupervisorOptions = useMemo((): SupervisorPickerOption[] => {
    if (!tab3Data) return []
    return supervisorOptionsFromTab3(tab3Data)
  }, [tab3Data])

  const catalogOptions = useMemo(
    () =>
      mergeSupervisorCatalog(
        apiSupervisorOptions,
        { id: effectivePrimaryId, label: effectivePrimaryLabel },
        { id: effectiveSecondaryId, label: effectiveSecondaryLabel },
      ),
    [
      apiSupervisorOptions,
      effectivePrimaryId,
      effectiveSecondaryId,
      effectivePrimaryLabel,
      effectiveSecondaryLabel,
    ],
  )

  const primaryVisible = useMemo(() => {
    const ex = effectiveSecondaryId ? new Set([effectiveSecondaryId]) : null
    if (!ex?.size) return catalogOptions
    return catalogOptions.filter((o) => !ex.has(o.id))
  }, [catalogOptions, effectiveSecondaryId])

  const secondaryVisible = useMemo(() => {
    const ex = effectivePrimaryId ? new Set([effectivePrimaryId]) : null
    if (!ex?.size) return catalogOptions
    return catalogOptions.filter((o) => !ex.has(o.id))
  }, [catalogOptions, effectivePrimaryId])

  const openChange = (which: "primary" | "secondary", open: boolean) => {
    if (open) setMenuOpen(which)
    else setMenuOpen((prev) => (prev === which ? null : prev))
  }

  const toSelectOptions = (opts: SupervisorPickerOption[]) =>
    opts.map((o) => ({ value: o.id, label: o.label, key: o.id }))

  const isLoadingSupervisorOptions = Boolean(supervisorUserId) && tab3Query.isLoading

  return (
    <div className="relative pt-1">
      {isLoadingSupervisorOptions ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
          <Spinner className="text-[#6C5DD3]" />
        </div>
      ) : null}

      {!isAddMode ? (
        <p className="mb-5 select-none text-[12px] font-semibold uppercase text-[#111827]">
          {employeeName}
        </p>
      ) : null}
      {tab3Query.isError ? (
        <p className="mb-3 text-[11px] text-red-500" role="alert">
          {tab3Query.error instanceof Error
            ? tab3Query.error.message
            : "Failed to load supervisor details"}
        </p>
      ) : null}
      <div className="grid max-w-[620px] grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        <Controller
          name="supervisorPrimaryId"
          control={control}
          render={({ field: idField }) => (
            <div>
              <p className="mb-0.5 block select-none text-[10px] font-medium text-[#2a2f3a]">
                Primary Supervisor
              </p>
              <SingleSelectDropdown
                value={effectivePrimaryId}
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
                value={effectiveSecondaryId}
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
