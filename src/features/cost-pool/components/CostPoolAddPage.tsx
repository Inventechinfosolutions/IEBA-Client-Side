import { CheckIcon, PlayIcon } from "lucide-react"
import { useMemo, useState } from "react"
import tableEmptyIcon from "@/assets/icons/table-empty.png"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

import { CostPoolUpsertMode } from "../enums/cost-pool.enum"
import type { CostPoolAddPageProps, CostPoolVisualCheckboxProps } from "../types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toTitleCase } from "@/lib/utils"


function VisualCheckbox({ checked }: CostPoolVisualCheckboxProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex size-5 items-center justify-center rounded-[6px] border ${
        checked
          ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
          : "border-[#D1D5DB] bg-white text-transparent"
      }`}
    >
      <CheckIcon className="size-4" />
    </span>
  )
}

export function CostPoolAddPage({
  form,
  onSubmit,
  onClose,
  mode,
  departmentOptions,
  departmentsLoading = false,
  activityRows,
  activitiesLoading = false,
  userRows,
  usersLoading = false,
  allowUserOrCostpoolDirect,
  isSubmitting = false,
  isLoadingDetails = false,
  readOnly = false,
}: CostPoolAddPageProps) {
  const [unassignedSearch, setUnassignedSearch] = useState("")
  const [assignedSearch, setAssignedSearch] = useState("")
  const [selectedUnassignedIds, setSelectedUnassignedIds] = useState<number[]>([])
  const [selectedAssignedIds, setSelectedAssignedIds] = useState<number[]>([])

  const [unassignedUserSearch, setUnassignedUserSearch] = useState("")
  const [assignedUserSearch, setAssignedUserSearch] = useState("")
  const [selectedUnassignedUserIds, setSelectedUnassignedUserIds] = useState<string[]>([])
  const [selectedAssignedUserIds, setSelectedAssignedUserIds] = useState<string[]>([])

  const assignedIds = form.watch("assignedActivityDepartmentIds")
  const assignedUserIds = form.watch("assignedUserIds") || []
  const departmentId = form.watch("departmentId")
  const hasDepartment = departmentId > 0
  const departmentCount = hasDepartment ? 1 : 0

  const departmentLabel = useMemo(() => {
    if (!hasDepartment) return ""
    return departmentOptions.find((d) => Number(d.id) === departmentId)?.name ?? ""
  }, [departmentOptions, departmentId, hasDepartment])

  const allowUserCostPoolDirect = useMemo(() => {
    if (!hasDepartment) return false
    if (allowUserOrCostpoolDirect !== undefined) {
      return allowUserOrCostpoolDirect
    }
    const opt = departmentOptions.find((d) => Number(d.id) === departmentId)
    return opt?.allowUserCostpoolDirect ?? false
  }, [departmentOptions, departmentId, hasDepartment, allowUserOrCostpoolDirect])

  const assigned = useMemo(
    () => activityRows.filter((a) => assignedIds.includes(a.activityDepartmentId)),
    [activityRows, assignedIds],
  )
  const unassigned = useMemo(
    () => activityRows.filter((a) => !assignedIds.includes(a.activityDepartmentId)),
    [activityRows, assignedIds],
  )

  const showUnassignedBody = hasDepartment && unassigned.length > 0

  const filteredUnassigned = useMemo(() => {
    const q = unassignedSearch.trim().toLowerCase()
    if (!q) return unassigned
    return unassigned.filter((a) => a.displayName.toLowerCase().includes(q))
  }, [unassigned, unassignedSearch])

  const filteredAssigned = useMemo(() => {
    const q = assignedSearch.trim().toLowerCase()
    if (!q) return assigned
    return assigned.filter((a) => a.displayName.toLowerCase().includes(q))
  }, [assigned, assignedSearch])

  const allUnassignedSelected =
    filteredUnassigned.length > 0 &&
    filteredUnassigned.every((a) => selectedUnassignedIds.includes(a.activityDepartmentId))
  const allAssignedSelected =
    filteredAssigned.length > 0 &&
    filteredAssigned.every((a) => selectedAssignedIds.includes(a.activityDepartmentId))

  const assignedUsers = useMemo(
    () => userRows.filter((u) => assignedUserIds.includes(u.userId)),
    [userRows, assignedUserIds],
  )
  const unassignedUsers = useMemo(
    () => userRows.filter((u) => !assignedUserIds.includes(u.userId)),
    [userRows, assignedUserIds],
  )

  const filteredUnassignedUsers = useMemo(() => {
    const q = unassignedUserSearch.trim().toLowerCase()
    if (!q) return unassignedUsers
    return unassignedUsers.filter((u) => u.displayName.toLowerCase().includes(q))
  }, [unassignedUsers, unassignedUserSearch])

  const filteredAssignedUsers = useMemo(() => {
    const q = assignedUserSearch.trim().toLowerCase()
    if (!q) return assignedUsers
    return assignedUsers.filter((u) => u.displayName.toLowerCase().includes(q))
  }, [assignedUsers, assignedUserSearch])


  const moveToAssigned = () => {
    if (selectedUnassignedIds.length === 0) return
    const allowed = new Set(activityRows.map((a) => a.activityDepartmentId))
    const nextToAdd = selectedUnassignedIds.filter((id) => allowed.has(id))
    form.setValue(
      "assignedActivityDepartmentIds",
      Array.from(new Set([...assignedIds, ...nextToAdd])),
    )
    setSelectedUnassignedIds([])
  }

  const moveToUnassigned = () => {
    if (selectedAssignedIds.length === 0) return
    form.setValue(
      "assignedActivityDepartmentIds",
      assignedIds.filter((id) => !selectedAssignedIds.includes(id)),
    )
    setSelectedAssignedIds([])
  }

  const moveToAssignedUsers = () => {
    if (selectedUnassignedUserIds.length === 0) return
    const allowed = new Set(userRows.map((u) => u.userId))
    const nextToAdd = selectedUnassignedUserIds.filter((id) => allowed.has(id))
    form.setValue(
      "assignedUserIds",
      Array.from(new Set([...assignedUserIds, ...nextToAdd])),
    )
    setSelectedUnassignedUserIds([])
  }

  const moveToUnassignedUsers = () => {
    if (selectedAssignedUserIds.length === 0) return
    form.setValue(
      "assignedUserIds",
      assignedUserIds.filter((id) => !selectedAssignedUserIds.includes(id)),
    )
    setSelectedAssignedUserIds([])
  }

  return (
    <div className="relative w-[1150px] max-w-[calc(100vw-2rem)] rounded-[10px] bg-white px-11 py-7 shadow-[0_0_20px_0_#0000001a]">
      {(isSubmitting || isLoadingDetails) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60">
          <Spinner className="text-[#6C5DD3]" />
        </div>
      )}
      <div className="space-y-3">
        <h2 className="text-center text-[25px] text-[#111827]">
          {mode === CostPoolUpsertMode.EDIT ? "Edit Cost Pool" : "Add Cost Pool"}
        </h2>

        <div className="flex items-center justify-end gap-2">
          <Checkbox
            disabled={readOnly}
            checked={form.watch("active")}
            onCheckedChange={(checked: boolean | "indeterminate") =>
              form.setValue("active", Boolean(checked))
            }
            className="border-[#6C5DD3] data-[state=checked]:bg-[#6C5DD3] data-[state=checked]:text-white disabled:opacity-50"
          />
          <span className="text-[13px] text-[#111827]">Active</span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        className="mt-6 space-y-6"
      >
        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-5 space-y-2">
            <Label className="text-[13px] text-[#111827]">Department</Label>
            <Select
              disabled={departmentsLoading || readOnly}
              value={departmentId > 0 ? String(departmentId) : ""}
              onValueChange={(value) => {
                form.setValue("departmentId", Number(value), { shouldValidate: true })
                form.setValue("assignedActivityDepartmentIds", [])
                form.setValue("assignedUserIds", [])
                setSelectedUnassignedIds([])
                setSelectedAssignedIds([])
                setSelectedUnassignedUserIds([])
                setSelectedAssignedUserIds([])
              }}
            >
              <SelectTrigger className="!h-14 w-full rounded-[8px] border-[#E5E7EB] bg-white">
                <SelectValue placeholder={departmentsLoading ? "Loading…" : "Select department"} />
              </SelectTrigger>
              <SelectContent
                position="popper"
                side="bottom"
                sideOffset={6}
                align="start"
                className="w-[--radix-select-trigger-width] rounded-[12px] border border-[#EEF0F5] p-2 shadow-[0_10px_30px_rgba(17,24,39,0.12)]"
              >
                {departmentOptions.map((d) => (
                  <SelectItem
                    key={d.id}
                    value={String(d.id)}
                    className="rounded-[10px] px-3 py-2.5 text-[14px]  text-[#111827] focus:bg-[#E6F4FF] focus:text-[#111827] data-[state=checked]:bg-[#E6F4FF] data-[state=checked]:font-semibold [&>span:first-child]:hidden"
                  >
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.departmentId?.message ? (
              <p className="text-sm text-destructive">
                {String(form.formState.errors.departmentId.message)}
              </p>
            ) : null}
          </div>

          <div className="col-span-2" />

          <div className="col-span-5 space-y-2">
            <Label className="text-[13px] text-[#111827]">Cost Pool</Label>
            <div
              className={!hasDepartment ? "cursor-not-allowed" : ""}
              aria-disabled={!hasDepartment}
            >
              <TitleCaseInput
                placeholder="Cost Pool Name"
                disabled={!hasDepartment || readOnly}
                className={[
                  "h-14 rounded-[8px] border-[#E5E7EB]",
                  !hasDepartment
                    ? "pointer-events-none bg-[#F3F4F6] text-[#9CA3AF] placeholder:text-[#9CA3AF]"
                    : "",
                ].join(" ")}
                {...form.register("costPool")}
              />
            </div>
            {form.formState.errors.costPool?.message ? (
              <p className="text-sm text-destructive">
                {String(form.formState.errors.costPool.message)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-5">
            <div className="rounded-[8px] border border-[#E5E7EB] bg-white">
              <div className="flex h-11 items-center justify-between rounded-t-[8px] bg-[#6C5DD3] px-3 text-[14px] text-white">
                <span>Select Activity(Unassigned)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={readOnly}
                    className="inline-flex items-center gap-2 disabled:opacity-50"
                    onClick={() =>
                      setSelectedUnassignedIds(
                        allUnassignedSelected ? [] : filteredUnassigned.map((a) => a.activityDepartmentId),
                      )
                    }
                  >
                    <span className="text-white/90">All</span>
                    <VisualCheckbox checked={allUnassignedSelected} />
                  </button>
                  <span className="inline-flex min-w-6 items-center justify-center rounded-[6px] bg-white/15 px-2 py-0.5 text-[11px]">
                    {filteredUnassigned.length}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] p-3">
                <TitleCaseInput
                  placeholder=""
                  value={unassignedSearch}
                  onChange={(e) => setUnassignedSearch(e.target.value)}
                  className="h-12 rounded-[8px] border-[#E5E7EB]"
                />

                {activitiesLoading && hasDepartment ? (
                  <div className="mt-3 flex h-[339px] items-center justify-center text-sm text-muted-foreground">
                    Loading activities…
                  </div>
                ) : showUnassignedBody ? (
                  <div className="mt-3">
                    <div className="flex h-9 items-center justify-between rounded-[8px] border border-[#E5E7EB] bg-[#F3F4F6] px-3 text-[12px] font-semibold text-[#111827]">
                      <span>{departmentLabel}</span>
                      <button
                        type="button"
                        disabled={readOnly}
                        className="inline-flex cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() =>
                          setSelectedUnassignedIds(
                            allUnassignedSelected ? [] : filteredUnassigned.map((a) => a.activityDepartmentId),
                          )
                        }
                      >
                        <VisualCheckbox checked={allUnassignedSelected} />
                      </button>
                    </div>
                    <div className="relative flex h-9 items-center justify-between bg-white px-3">
                      <span className="rounded-[8px] bg-white px-3 py-1 text-[12px] font-semibold text-[#111827] shadow-[0_4px_14px_rgba(17,24,39,0.12)]">
                        Activity
                      </span>
                      <button
                        type="button"
                        disabled={readOnly}
                        className="inline-flex cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() =>
                          setSelectedUnassignedIds(
                            allUnassignedSelected ? [] : filteredUnassigned.map((a) => a.activityDepartmentId),
                          )
                        }
                      >
                        <VisualCheckbox checked={allUnassignedSelected} />
                      </button>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-[18px] bottom-[-12px] h-4 w-px bg-[#E5E7EB]"
                      />
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="relative">
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute left-[18px] top-[-12px] bottom-0 w-px bg-[#E5E7EB]"
                        />
                        <div>
                          {filteredUnassigned.map((a) => {
                            const checked = selectedUnassignedIds.includes(a.activityDepartmentId)
                            return (
                              <div
                                key={a.activityDepartmentId}
                                role="button"
                                tabIndex={0}
                                className={`flex w-full items-center justify-between gap-3 px-3 py-1 text-left text-[12px] leading-4 ${readOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                                onClick={() => {
                                  if (readOnly) return
                                  setSelectedUnassignedIds((prev) =>
                                    prev.includes(a.activityDepartmentId)
                                      ? prev.filter((x) => x !== a.activityDepartmentId)
                                      : [...prev, a.activityDepartmentId],
                                  )
                                }}
                                onKeyDown={(e) => {
                                  if (e.key !== "Enter" && e.key !== " ") return
                                  e.preventDefault()
                                  setSelectedUnassignedIds((prev) =>
                                    prev.includes(a.activityDepartmentId)
                                      ? prev.filter((x) => x !== a.activityDepartmentId)
                                      : [...prev, a.activityDepartmentId],
                                  )
                                }}
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="relative pl-7 flex items-center min-w-0">
                                    <span
                                      aria-hidden="true"
                                      className="pointer-events-none absolute left-[6px] w-[22px] top-1/2 -translate-y-1/2 border-t border-[#E5E7EB]"
                                    />
                                    {a.isChild ? (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center min-w-0">
                                              <div className="flex items-center justify-center w-[16px] h-[22px] rounded-full border border-[#6C5DD3] bg-white text-[#6C5DD3] text-[10px] font-bold shrink-0">
                                                {a.level || 1}
                                              </div>
                                              <div className="w-2 h-px bg-[#E5E7EB] ml-[3px] mr-[2px] shrink-0" />
                                              <span className="text-[13px] font-normal whitespace-normal wrap-break-word pr-2">
                                                <span className="text-[#111827] font-normal">
                                                  {toTitleCase(a.name)}
                                                </span>
                                                {a.code && (
                                                  <span className="text-[#6C5DD3] font-normal">
                                                    {" "}({a.code})
                                                  </span>
                                                )}
                                              </span>
                                            </div>
                                          </TooltipTrigger>
                                          {a.parentName && (
                                            <TooltipContent>
                                              {a.parentName}
                                            </TooltipContent>
                                          )}
                                        </Tooltip>
                                      </TooltipProvider>
                                    ) : (
                                      <span className="text-[13px] font-medium whitespace-normal wrap-break-word pr-2">
                                        {a.code ? (
                                          <>
                                            <span className="text-[#6C5DD3] font-bold">({a.code})</span>
                                            <span className="text-[#111827]"> - {toTitleCase(a.name)}</span>
                                          </>
                                        ) : (
                                          <span className="text-[#374151]">{toTitleCase(a.name)}</span>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <VisualCheckbox checked={checked} />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="mt-3 flex h-[339px] flex-col items-center justify-center space-y-3 grayscale opacity-80">
                    <img src={tableEmptyIcon} alt="No data" className="size-25 object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-2 flex flex-col items-center justify-center gap-3 pt-40">
            <Button
              type="button"
              onClick={moveToAssigned}
              className="h-11 w-17 rounded-[10px] bg-[#6C5DD3] px-0 text-white shadow-[0_10px_18px_rgba(108,93,211,0.25)] hover:bg-[#5B4DC5] disabled:opacity-50 disabled:bg-[#6C5DD3]"
              disabled={selectedUnassignedIds.length === 0 || readOnly}
            >
              <PlayIcon className="size-3 fill-white text-white" />
            </Button>
            <Button
              type="button"
              onClick={moveToUnassigned}
              className="h-11 w-17 rounded-[10px] bg-[#6C5DD3] px-0 text-white shadow-[0_10px_18px_rgba(108,93,211,0.25)] hover:bg-[#5B4DC5] disabled:opacity-50 disabled:bg-[#6C5DD3]"
              disabled={selectedAssignedIds.length === 0 || readOnly}
            >
              <PlayIcon className="size-3 rotate-180 fill-white text-white" />
            </Button>
          </div>

          <div className="col-span-5">
            <div className="rounded-[8px] border border-[#E5E7EB] bg-white">
              <div className="flex h-11 items-center justify-between rounded-t-[8px] bg-[#6C5DD3] px-3 text-[14px] text-white">
                <span>Select Activity(Assigned)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={readOnly}
                    className="inline-flex items-center gap-2 disabled:opacity-50"
                    onClick={() =>
                      setSelectedAssignedIds(
                        allAssignedSelected ? [] : filteredAssigned.map((a) => a.activityDepartmentId),
                      )
                    }
                  >
                    <span className="text-white/90">All</span>
                    <VisualCheckbox checked={allAssignedSelected} />
                  </button>
                  <span className="inline-flex min-w-6 items-center justify-center rounded-[6px] bg-white/15 px-2 py-0.5 text-[11px]">
                    {filteredAssigned.length}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] p-3">
                <TitleCaseInput
                  placeholder=""
                  value={assignedSearch}
                  onChange={(e) => setAssignedSearch(e.target.value)}
                  className="h-12 rounded-[8px] border-[#E5E7EB]"
                />

                {activitiesLoading && hasDepartment ? (
                  <div className="mt-3 flex h-[339px] items-center justify-center text-sm text-muted-foreground">
                    Loading activities…
                  </div>
                ) : hasDepartment && assigned.length > 0 ? (
                  <div className="mt-3">
                    <div className="flex h-9 items-center justify-between rounded-[8px] border border-[#E5E7EB] bg-[#F3F4F6] px-3 text-[12px] font-semibold text-[#111827]">
                      <span>{departmentLabel}</span>
                      <button
                        type="button"
                        disabled={readOnly}
                        className="inline-flex cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() =>
                          setSelectedAssignedIds(
                            allAssignedSelected ? [] : filteredAssigned.map((a) => a.activityDepartmentId),
                          )
                        }
                      >
                        <VisualCheckbox checked={allAssignedSelected} />
                      </button>
                    </div>
                    <div className="relative flex h-9 items-center justify-between bg-white px-3">
                      <span className="rounded-[8px] bg-white px-3 py-1 text-[12px] font-semibold text-[#111827] shadow-[0_4px_14px_rgba(17,24,39,0.12)]">
                        Activity
                      </span>
                      <button
                        type="button"
                        disabled={readOnly}
                        className="inline-flex cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() =>
                          setSelectedAssignedIds(
                            allAssignedSelected ? [] : filteredAssigned.map((a) => a.activityDepartmentId),
                          )
                        }
                      >
                        <VisualCheckbox checked={allAssignedSelected} />
                      </button>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-[18px] bottom-[-12px] h-4 w-px bg-[#E5E7EB]"
                      />
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="relative">
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute left-[18px] top-[-12px] bottom-0 w-px bg-[#E5E7EB]"
                        />
                        <div>
                          {filteredAssigned.map((a) => {
                            const checked = selectedAssignedIds.includes(a.activityDepartmentId)
                            return (
                              <div
                                key={a.activityDepartmentId}
                                role="button"
                                tabIndex={0}
                                className={`flex w-full items-center justify-between gap-3 px-3 py-1 text-left text-[12px] leading-4 ${readOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                                onClick={() => {
                                  if (readOnly) return
                                  setSelectedAssignedIds((prev) =>
                                    prev.includes(a.activityDepartmentId)
                                      ? prev.filter((x) => x !== a.activityDepartmentId)
                                      : [...prev, a.activityDepartmentId],
                                  )
                                }}
                                onKeyDown={(e) => {
                                  if (e.key !== "Enter" && e.key !== " ") return
                                  e.preventDefault()
                                  setSelectedAssignedIds((prev) =>
                                    prev.includes(a.activityDepartmentId)
                                      ? prev.filter((x) => x !== a.activityDepartmentId)
                                      : [...prev, a.activityDepartmentId],
                                  )
                                }}
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="relative pl-7 flex items-center min-w-0">
                                    <span
                                      aria-hidden="true"
                                      className="pointer-events-none absolute left-[6px] w-[22px] top-1/2 -translate-y-1/2 border-t border-[#E5E7EB]"
                                    />
                                    {a.isChild ? (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center min-w-0">
                                              <div className="flex items-center justify-center w-[16px] h-[22px] rounded-full border border-[#6C5DD3] bg-white text-[#6C5DD3] text-[10px] font-bold shrink-0">
                                                {a.level || 1}
                                              </div>
                                              <div className="w-2 h-px bg-[#E5E7EB] ml-[3px] mr-[2px] shrink-0" />
                                              <span className="text-[13px] font-normal whitespace-normal wrap-break-word pr-2">
                                                <span className="text-[#111827] font-normal">
                                                  {toTitleCase(a.name)}
                                                </span>
                                                {a.code && (
                                                  <span className="text-[#6C5DD3] font-normal">
                                                    {" "}({a.code})
                                                  </span>
                                                )}
                                              </span>
                                            </div>
                                          </TooltipTrigger>
                                          {a.parentName && (
                                            <TooltipContent>
                                              {a.parentName}
                                            </TooltipContent>
                                          )}
                                        </Tooltip>
                                      </TooltipProvider>
                                    ) : (
                                      <span className="text-[13px] font-medium whitespace-normal wrap-break-word pr-2">
                                        {a.code ? (
                                          <>
                                            <span className="text-[#6C5DD3] font-bold">({a.code})</span>
                                            <span className="text-[#111827]"> - {toTitleCase(a.name)}</span>
                                          </>
                                        ) : (
                                          <span className="text-[#374151]">{toTitleCase(a.name)}</span>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <VisualCheckbox checked={checked} />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="mt-3 flex h-[339px] flex-col items-center justify-center space-y-3 grayscale opacity-80">
                    <img src={tableEmptyIcon} alt="No data" className="size-25 object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Employee Section — show when allowUserCostpoolDirect is true for the selected department */}
        {hasDepartment && allowUserCostPoolDirect && (
        <div className="grid grid-cols-12 items-start gap-6 pt-10">
          <div className="col-span-5">
            <div className="rounded-[10px] border border-[#E5E7EB] bg-white shadow-[0_4px_14px_rgba(17,24,39,0.05)]">
              <div className="flex h-[42px] items-center justify-between rounded-t-[10px] bg-[#6C5DD3] px-4 text-[13px] font-medium text-white">
                <span>{filteredUnassignedUsers.length} item</span>
                <span>Unassigned Employee</span>
              </div>

              <div className="p-4">
                <div className="relative mb-4">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#9CA3AF]"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </span>
                  <TitleCaseInput
                    placeholder="Search here"
                    value={unassignedUserSearch}
                    onChange={(e) => setUnassignedUserSearch(e.target.value)}
                    className="h-11 rounded-[8px] border-[#E5E7EB] pl-10 text-[13px] placeholder:text-[#9CA3AF] focus:border-[#6C5DD3] focus:ring-[#6C5DD3]"
                  />
                </div>

                {usersLoading && hasDepartment ? (
                  <ScrollArea className="h-[280px]">
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Loading employees…
                    </div>
                  </ScrollArea>
                ) : hasDepartment && filteredUnassignedUsers.length > 0 ? (
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-1">
                      {filteredUnassignedUsers.map((u) => {
                        const checked = selectedUnassignedUserIds.includes(u.userId)
                        return (
                          <div
                            key={u.userId}
                            role="button"
                            tabIndex={0}
                            className={`flex items-center justify-between rounded-[8px] px-3 py-2.5 transition-colors hover:bg-[#F9FAFB] ${readOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                            onClick={() => {
                              if (readOnly) return
                              setSelectedUnassignedUserIds((prev) =>
                                prev.includes(u.userId)
                                  ? prev.filter((x) => x !== u.userId)
                                  : [...prev, u.userId],
                              )
                            }}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return
                              e.preventDefault()
                              setSelectedUnassignedUserIds((prev) =>
                                prev.includes(u.userId)
                                  ? prev.filter((x) => x !== u.userId)
                                  : [...prev, u.userId],
                              )
                            }}
                          >
                            <span className="text-[13px] font-medium text-[#374151]">
                              {u.displayName}
                            </span>
                            <VisualCheckbox checked={checked} />
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex h-[280px] flex-col items-center justify-center space-y-3 grayscale opacity-80">
                    <img src={tableEmptyIcon} alt="No data" className="size-25 object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-2 flex flex-col items-center justify-center gap-3 pt-32">
            <Button
              type="button"
              onClick={moveToAssignedUsers}
              disabled={selectedUnassignedUserIds.length === 0 || readOnly}
              className="h-11 w-17 rounded-[10px] bg-[#6C5DD3] px-0 text-white shadow-[0_10px_18px_rgba(108,93,211,0.25)] hover:bg-[#5B4DC5] disabled:opacity-50 disabled:bg-[#6C5DD3]"
            >
              <PlayIcon className="size-3 fill-white text-white" />
            </Button>
            <Button
              type="button"
              onClick={moveToUnassignedUsers}
              disabled={selectedAssignedUserIds.length === 0 || readOnly}
              className="h-11 w-17 rounded-[10px] bg-[#6C5DD3] px-0 text-white shadow-[0_10px_18px_rgba(108,93,211,0.25)] hover:bg-[#5B4DC5] disabled:opacity-50 disabled:bg-[#6C5DD3]"
            >
              <PlayIcon className="size-3 rotate-180 fill-white text-white" />
            </Button>
          </div>

          <div className="col-span-5">
            <div className="rounded-[10px] border border-[#E5E7EB] bg-white shadow-[0_4px_14px_rgba(17,24,39,0.05)]">
              <div className="flex h-[42px] items-center justify-between rounded-t-[10px] bg-[#6C5DD3] px-4 text-[13px] font-medium text-white">
                <span>{filteredAssignedUsers.length} item</span>
                <span>Assigned Employee</span>
              </div>

              <div className="p-4">
                <div className="relative mb-4">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#9CA3AF]"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </span>
                  <TitleCaseInput
                    placeholder="Search here"
                    value={assignedUserSearch}
                    onChange={(e) => setAssignedUserSearch(e.target.value)}
                    className="h-11 rounded-[8px] border-[#E5E7EB] pl-10 text-[13px] placeholder:text-[#9CA3AF] focus:border-[#6C5DD3] focus:ring-[#6C5DD3]"
                  />
                </div>

                {hasDepartment && filteredAssignedUsers.length > 0 ? (
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-1">
                      {filteredAssignedUsers.map((u) => {
                        const checked = selectedAssignedUserIds.includes(u.userId)
                        return (
                          <div
                            key={u.userId}
                            role="button"
                            tabIndex={0}
                            className={`flex items-center justify-between rounded-[8px] px-3 py-2.5 transition-colors hover:bg-[#F9FAFB] ${readOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                            onClick={() => {
                              if (readOnly) return
                              setSelectedAssignedUserIds((prev) =>
                                prev.includes(u.userId)
                                  ? prev.filter((x) => x !== u.userId)
                                  : [...prev, u.userId],
                              )
                            }}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return
                              e.preventDefault()
                              setSelectedAssignedUserIds((prev) =>
                                prev.includes(u.userId)
                                  ? prev.filter((x) => x !== u.userId)
                                  : [...prev, u.userId],
                              )
                            }}
                          >
                            <span className="text-[13px] font-medium text-[#374151]">
                              {u.displayName}
                            </span>
                            <VisualCheckbox checked={checked} />
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex h-[280px] flex-col items-center justify-center space-y-3 grayscale opacity-80">
                    <img src={tableEmptyIcon} alt="No data" className="size-25 object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

        <div className="flex items-center justify-end gap-3 pt-2">
          {!readOnly && (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-[10px] bg-[#6C5DD3] px-6 text-white hover:bg-[#5B4DC5]"
            >
              Save
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            className="h-10 rounded-[10px] px-6"
            onClick={onClose}
          >
            Exit
          </Button>
        </div>
      </form>
    </div>
  )
}
