import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronDown, Eye, Search, Trash2, X } from "lucide-react"
import { useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SchedulePayPeriodGroupStatus } from "../enums/schedule-time-study.enum"
import { useCreateRmtsPpGroupListBatch } from "../mutations/createRmtsPpGroupListBatch"
import { useDeleteRmtsPpGroupList } from "../mutations/deleteRmtsPpGroupList"
import { useGetScheduleTimeStudyUsersByDepartment } from "../queries/getScheduleTimeStudyUsersByDepartment"
import { useGetScheduleTimeStudyJobPoolsByDepartment } from "../queries/getScheduleTimeStudyJobPoolsByDepartment"
import {
  scheduleTimeStudyModalDefaultValues,
  scheduleTimeStudyModalFormSchema,
} from "../schemas"
import {
  DEFAULT_SCHEDULE_PARTICIPANT_GROUP_OPTIONS,
  getFiscalYearLabelFromMmDdYyyy,
} from "../types"
import type {
  RmtsGroupApiDto,
  ScheduleTimeStudyFormProps,
  ScheduleTimeStudyModalFormValues,
} from "../types"

const participantGroupSuccessToastOptions = {
  position: "top-center" as const,
  icon: (
    <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
      <Check className="size-3 stroke-3" />
    </span>
  ),
  className:
    "!w-fit !max-w-[340px] !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
}

function getFirstNestedFormError(errors: unknown): string | null {
  if (!errors || typeof errors !== "object") return null
  const record = errors as Record<string, unknown>
  if ("message" in record && typeof record.message === "string" && record.message) {
    return record.message
  }
  for (const value of Object.values(record)) {
    const nested = getFirstNestedFormError(value)
    if (nested) return nested
  }
  return null
}

function mapGroupNamesToIds(namesCsv: string, all: RmtsGroupApiDto[]): string | null {
  const names = namesCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (names.length === 0) return null
  const ids: number[] = []
  for (const name of names) {
    const match = all.find((g) => g.name.trim() === name)
    if (!match) return null
    ids.push(match.id)
  }
  return ids.join(",")
}

export function ScheduleTimeStudyForm({
  open,
  onOpenChange,
  selectedDepartment,
  selectedDepartmentName,
  selectedStudyYear,
  departmentId,
  fiscalYearOptions,
  periodRows,
  participantGroupOptions,
  groupsDetailed,
  editingRow,
}: ScheduleTimeStudyFormProps) {
  const createBatch = useCreateRmtsPpGroupListBatch()
  const deleteScheduledRow = useDeleteRmtsPpGroupList()

  const form = useForm<ScheduleTimeStudyModalFormValues>({
    resolver: zodResolver(scheduleTimeStudyModalFormSchema),
    defaultValues: {
      ...scheduleTimeStudyModalDefaultValues,
      department: selectedDepartment,
      studyYear: selectedStudyYear,
      ...(editingRow
        ? {
            entries: [
              {
                timeStudyPeriod: editingRow.timeStudyPeriod,
                groups: editingRow.groups,
                status: SchedulePayPeriodGroupStatus.DRAFT,
              },
            ],
          }
        : {}),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  })

  const studyYear = form.watch("studyYear")
  const entries = useWatch({ control: form.control, name: "entries" }) ?? []

  const [usersModalOpen, setUsersModalOpen] = useState(false)
  const [viewEntryIndex, setViewEntryIndex] = useState<number | null>(null)
  const [openGroupsDropdownIndex, setOpenGroupsDropdownIndex] = useState<number | null>(null)
  const [groupsSearch, setGroupsSearch] = useState("")

  const selectedDepartmentLabel =
    selectedDepartmentName.trim() || (selectedDepartment.trim() ? "—" : "")

  const departmentUsersQuery = useGetScheduleTimeStudyUsersByDepartment({
    departmentId: usersModalOpen ? departmentId : null,
  })
  const jobPoolsQuery = useGetScheduleTimeStudyJobPoolsByDepartment({
    departmentId: usersModalOpen ? departmentId : null,
    enabled: usersModalOpen,
  })

  const handleSubmitWithStatus = (targetStatus: SchedulePayPeriodGroupStatus) =>
    form.handleSubmit(
      async (values) => {
      if (departmentId == null || departmentId <= 0) {
        toast.error("Department is not ready for saving. Try again in a moment.")
        return
      }

      const items: Array<{
        ppId: number
        departmentId: number
        groupIds: string
        status: SchedulePayPeriodGroupStatus
        fiscalyear: string
      }> = []

      for (const entry of values.entries) {
        if (!entry.timeStudyPeriod.trim()) continue
        const matchedPeriod = periodRows.find(
          (row) => row.timeStudyPeriod === entry.timeStudyPeriod,
        )
        if (!matchedPeriod) {
          toast.error("Selected pay period was not found.")
          return
        }
        const ppId = Number(matchedPeriod.id)
        if (!Number.isFinite(ppId) || ppId <= 0) {
          toast.error("Invalid pay period id.")
          return
        }
        const groupIds = mapGroupNamesToIds(entry.groups, groupsDetailed)
        if (groupIds == null) {
          toast.error("Could not resolve one or more groups. Pick groups from the list.")
          return
        }
        items.push({
          ppId,
          departmentId,
          groupIds,
          status: targetStatus,
          fiscalyear: values.studyYear,
        })
      }

      if (items.length === 0) {
        toast.error("Add at least one scheduling row with a pay period and groups.")
        return
      }

      try {
        if (editingRow?.id) {
          const id = Number(editingRow.id)
          if (Number.isFinite(id) && id > 0) {
            await deleteScheduledRow.mutateAsync(id)
          }
        }
        await createBatch.mutateAsync({ items })
        toast.success(
          editingRow ? "Scheduling updated successfully" : "Scheduling created successfully",
          participantGroupSuccessToastOptions,
        )
        onOpenChange(false)
        form.reset({
          ...scheduleTimeStudyModalDefaultValues,
          department: selectedDepartment,
          studyYear: selectedStudyYear,
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed")
      }
      },
      (errors) => {
        toast.error(getFirstNestedFormError(errors) ?? "Please fix the errors in the form")
      },
    )

  const getSelectedGroups = (value: string) =>
    value
      .split(",")
      .map((group) => group.trim())
      .filter(Boolean)


  const availablePeriods = periodRows.filter(
    (row) => getFiscalYearLabelFromMmDdYyyy(row.startDate) === studyYear
  )
  const periodOptions = Array.from(new Set(availablePeriods.map((row) => row.timeStudyPeriod)))
  const groupOptions =
    participantGroupOptions.length > 0
      ? participantGroupOptions
      : [...DEFAULT_SCHEDULE_PARTICIPANT_GROUP_OPTIONS]


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showClose={false}
          className="min-h-[460px] w-[1120px] max-w-[calc(100vw-2rem)] rounded-[8px] border border-[#E5E7EB] bg-white p-[16px_16px_18px]"
          overlayClassName="bg-black/45"
        >
          <DialogTitle className="text-center text-[20px] font-normal text-black">
            Create Schedule Time Study
          </DialogTitle>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            <div className="flex items-end justify-between">
              <div className="flex items-end gap-6">
                <div className="space-y-1">
                  <Label className="text-[14px] font-normal text-black">Select Year</Label>
                  <Select
                    value={studyYear}
                    onValueChange={(value) =>
                      form.setValue("studyYear", value, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger className="!h-12 w-[140px] rounded-[10px] border-[#D1D5DB] px-[11px] py-0 text-[14px] data-[size=default]:!h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      side="bottom"
                      avoidCollisions={false}
                      sideOffset={10}
                      align="start"
                      className="w-[150px] rounded-[10px] border border-[#E5E7EB] p-1"
                    >
                      {fiscalYearOptions.map((fy) => (
                        <SelectItem key={fy.id} value={fy.id}>
                          {fy.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[14px] font-normal text-black">Select Department</Label>
                  <TitleCaseInput
                    readOnly
                    value={selectedDepartmentLabel}
                    className="!h-12 w-[160px] cursor-not-allowed rounded-[10px] border-[#D1D5DB] bg-[#F9FAFB] px-[11px] text-[14px] text-[#111827]"
                  />
                </div>
              </div>

              <Button
                type="button"
                className="h-10 w-[92px] rounded-[10px] bg-[#6C5DD3] text-[14px] font-medium text-white hover:bg-[#5D4FC4]"
                onClick={() =>
                  append({
                    timeStudyPeriod: "",
                    groups: "",
                    status: SchedulePayPeriodGroupStatus.DRAFT,
                  })
                }
              >
                + Add New
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => {
                const entry = entries[index]
                const groupsValue = entry?.groups ?? ""
                return (
                  <div
                    key={field.id}
                    className="rounded-[10px] border border-[#E5E7EB] p-[18px_20px]"
                  >
                    <div className="grid grid-cols-[190px_1fr_70px_90px_28px] gap-4">
                      <div className="space-y-1">
                        <Label className="text-[14px] font-normal text-black">
                          Select Time Study Period
                        </Label>
                        <Select
                          value={entry?.timeStudyPeriod ?? ""}
                          onValueChange={(value) =>
                            form.setValue(`entries.${index}.timeStudyPeriod`, value, {
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger className="!h-[40px] w-full rounded-[10px] border-[#D1D5DB] px-[10px] py-0 text-[14px] data-[size=default]:!h-[40px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent
                            position="popper"
                            side="bottom"
                            avoidCollisions={false}
                            sideOffset={8}
                            align="start"
                            className="rounded-[10px] border border-[#E5E7EB] p-1"
                          >
                            {periodOptions.map((period) => (
                              <SelectItem key={period} value={period}>
                                {period}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[14px] font-normal text-black">Groups</Label>
                        <div className="relative">
                          <div
                            className={cn(
                              "flex min-h-[40px] w-full items-center gap-1 rounded-[10px] border border-[#D1D5DB] px-2 transition-all cursor-text",
                              openGroupsDropdownIndex === index && "border-[#6C5DD3] ring-1 ring-[#6C5DD3]"
                            )}
                            onClick={() => setOpenGroupsDropdownIndex(index)}
                          >
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 py-1">
                              {getSelectedGroups(groupsValue).map((group) => (
                                <span
                                  key={group}
                                  className="inline-flex max-w-[150px] items-center gap-1 rounded-[4px] bg-[#F3F4F6] px-2 py-0.5 text-[13px] text-[#111827]"
                                >
                                  <span className="truncate">{group}</span>
                                  <button
                                    type="button"
                                    className="text-[#9CA3AF] hover:text-[#EF4444]"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const nextGroups = getSelectedGroups(groupsValue).filter(
                                        (item) => item !== group
                                      )
                                      form.setValue(`entries.${index}.groups`, nextGroups.join(", "), {
                                        shouldValidate: true,
                                      })
                                    }}
                                  >
                                    <X className="size-3.5" />
                                  </button>
                                </span>
                              ))}
                              <input
                                autoFocus={openGroupsDropdownIndex === index}
                                value={openGroupsDropdownIndex === index ? groupsSearch : ""}
                                onChange={(e) => setGroupsSearch(e.target.value)}
                                onFocus={() => setOpenGroupsDropdownIndex(index)}
                                className="min-w-[60px] flex-1 bg-transparent text-[14px] outline-none"
                                placeholder={
                                  getSelectedGroups(groupsValue).length === 0 ? "Select group" : ""
                                }
                              />
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Search className="size-4 text-[#C4C4C4]" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenGroupsDropdownIndex(openGroupsDropdownIndex === index ? null : index)
                                }}
                                className="text-[#9CA3AF]"
                              >
                                <ChevronDown
                                  className={cn(
                                    "size-4 transition-transform",
                                    openGroupsDropdownIndex === index && "rotate-180"
                                  )}
                                />
                              </button>
                            </div>
                          </div>

                          {openGroupsDropdownIndex === index && (
                            <div
                              className="absolute top-[calc(100%+6px)] z-50 w-full rounded-[12px] border border-[#E5E7EB] bg-white p-1 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                              onMouseDown={(e) => e.preventDefault()} // Prevent focus loss when clicking list
                            >
                              <ScrollArea className="max-h-[260px]">
                                <div className="space-y-0.5 p-1">
                                  {groupOptions
                                    .filter((g) =>
                                      g.toLowerCase().includes(groupsSearch.toLowerCase())
                                    )
                                    .map((group) => {
                                      const isSelected = getSelectedGroups(groupsValue).includes(group)
                                      return (
                                        <button
                                          key={group}
                                          type="button"
                                          className={cn(
                                            "flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-[14px] hover:bg-[#F3F4F6] transition-colors",
                                            isSelected && "bg-[#F3F4F6] text-[#6C5DD3] font-medium"
                                          )}
                                          onClick={() => {
                                            const current = getSelectedGroups(groupsValue)
                                            const next = isSelected
                                              ? current.filter((i) => i !== group)
                                              : [...current, group]
                                            form.setValue(`entries.${index}.groups`, next.join(", "), {
                                              shouldValidate: true,
                                            })
                                          }}
                                        >
                                          <span>{group}</span>
                                          {isSelected && <Check className="size-4 text-[#6C5DD3]" strokeWidth={2.5} />}
                                        </button>
                                      )
                                    })}
                                  {groupOptions.filter((g) =>
                                    g.toLowerCase().includes(groupsSearch.toLowerCase())
                                  ).length === 0 && (
                                    <div className="px-3 py-4 text-center text-[14px] text-[#9CA3AF]">
                                      No groups found
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[14px] font-normal text-black">Users</Label>
                        <div className="flex h-[40px] items-center px-2 text-[#6C5DD3]">
                          <button
                            type="button"
                            onClick={() => {
                              setViewEntryIndex(index)
                              setUsersModalOpen(true)
                            }}
                            className="inline-flex items-center text-[#6C5DD3]"
                            aria-label="Open users list"
                          >
                            <Eye className="size-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[14px] font-normal text-black">Status</Label>
                        <div className="flex h-[40px] items-center text-[14px] text-[#111827]">
                          {entry?.status
                            ? `${entry.status.charAt(0).toUpperCase()}${entry.status.slice(1).toLowerCase()}`
                            : ""}
                        </div>
                      </div>

                      <div className="flex items-end pb-2">
                        {index < fields.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (fields.length <= 1) return
                              remove(index)
                            }}
                            className="text-[#DC2626]"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end gap-5 pr-8">
              <Button
                type="button"
                className="h-[42px] w-[88px] rounded-[10px] bg-[#6C5DD3] text-[16px] font-normal text-white hover:bg-[#5D4FC4]"
                disabled={createBatch.isPending || deleteScheduledRow.isPending}
                onClick={() => void handleSubmitWithStatus(SchedulePayPeriodGroupStatus.PUBLISHED)()}
              >
                Submit
              </Button>
              <Button
                type="button"
                className="h-[42px] w-[88px] rounded-[10px] bg-[#6C5DD3] text-[16px] font-normal text-white hover:bg-[#5D4FC4]"
                disabled={createBatch.isPending || deleteScheduledRow.isPending}
                onClick={() => void handleSubmitWithStatus(SchedulePayPeriodGroupStatus.DRAFT)()}
              >
                Save
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-[42px] w-[70px] rounded-[10px] bg-[#D9D9D9] text-[16px] font-normal text-black hover:bg-[#CDCDCD]"
                onClick={() => onOpenChange(false)}
              >
                Exit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={usersModalOpen}
        onOpenChange={(next) => {
          setUsersModalOpen(next)
          if (!next) setViewEntryIndex(null)
        }}
      >
        <DialogContent
          showClose={false}
          className="w-[720px] max-w-[calc(100vw-2rem)] rounded-[8px] border border-[#E5E7EB] bg-white p-[14px_24px_16px]"
          overlayClassName="bg-black/45"
        >
          <DialogTitle className="text-center text-[25px] font-normal text-[#6C5DD3]">
            List of User in Group
          </DialogTitle>

          <div className="rounded-[8px] border border-[#E5E7EB]">
            <div className="h-10 rounded-t-[8px] bg-[#6C5DD3] px-4 py-2 text-[16px] font-medium text-white">
              List of Users
            </div>
            <div className="min-h-[360px] bg-white">
              {(() => {
                const idx = viewEntryIndex
                const entry = idx != null ? entries[idx] : null
                const groupNames = entry?.groups
                  ? entry.groups
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : []

                const groups = groupNames
                  .map((name) => groupsDetailed.find((g) => g.name.trim() === name))
                  .filter((g): g is RmtsGroupApiDto => g != null)

                const departmentUsers = departmentUsersQuery.data ?? []
                const jobPools = jobPoolsQuery.data ?? []

                const resolveUserLabel = (id: string): string => {
                  const u = departmentUsers.find((x) => x.id === id)
                  let jpUserLabel = ""
                  if (!u) {
                    for (const jp of jobPools) {
                      const jpu = jp.userprofiles?.find((x) => x.id === id)
                      if (jpu) {
                        jpUserLabel =
                          (jpu.name ?? "").trim() ||
                          `${jpu.firstName ?? ""} ${jpu.lastName ?? ""}`.trim()
                        if (jpUserLabel) break
                      }
                    }
                  }

                  return (
                    (u?.name ?? "").trim() ||
                    `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() ||
                    (u?.user?.loginId ?? "").trim() ||
                    jpUserLabel ||
                    id
                  )
                }

                const resolveJobPoolUsers = (jobPoolId: string) => {
                  const jp = jobPools.find((p) => String(p.id) === jobPoolId)
                  const users = jp?.userprofiles ?? []
                  return users.map((u) => {
                    const deptUser = departmentUsers.find((du) => du.id === u.id)
                    const label =
                      (u.name ?? "").trim() ||
                      `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
                      (deptUser?.name ?? "").trim() ||
                      `${deptUser?.firstName ?? ""} ${deptUser?.lastName ?? ""}`.trim() ||
                      (deptUser?.user?.loginId ?? "").trim() ||
                      u.id
                    return { id: u.id, label }
                  })
                }

                const loading =
                  departmentUsersQuery.isFetching ||
                  jobPoolsQuery.isFetching ||
                  (usersModalOpen && idx != null && (departmentId == null || departmentId <= 0))

                if (loading) {
                  return (
                    <div className="space-y-3 p-4">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div key={`sched-users-skel-${i}`} className="flex items-center gap-3">
                          <Skeleton className="h-4 w-4 rounded-[4px]" />
                          <Skeleton className="h-4 w-[75%]" />
                        </div>
                      ))}
                    </div>
                  )
                }

                if (groups.length === 0) {
                  return (
                    <div className="flex min-h-[360px] items-center justify-center px-6 text-[14px] text-[#6B7280]">
                      Select a Time Study Period and at least one Group to view users.
                    </div>
                  )
                }

                return (
                  <ScrollArea className="h-[360px]">
                    <div className="p-4 space-y-4">
                      {groups.map((g) => {
                        const userIds = [...new Set((g.users ?? []).map((x) => x.trim()).filter(Boolean))]
                        const jobPoolIds = [...new Set((g.jobPools ?? []).map((x) => x.trim()).filter(Boolean))]

                        const jobPoolUserRows = jobPoolIds.flatMap(resolveJobPoolUsers)
                        const jobPoolUserIdsSet = new Set(jobPoolUserRows.map((u) => u.id))
                        const filteredUserIds = userIds.filter((id) => !jobPoolUserIdsSet.has(id))

                        return (
                          <div key={g.id} className="overflow-hidden rounded-[8px] border border-[#E5E7EB] mb-4 last:mb-0">
                            <div className="grid h-7 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-[#F3F4F6] pl-4 pr-5 text-[12px] font-semibold text-[#374151]">
                              <span className="min-w-0">{g.name || "—"}</span>
                              <Checkbox
                                checked={false}
                                className="size-4.5 shrink-0 rounded-[6px] border-[#E5E7EB] bg-white opacity-60 pointer-events-none"
                              />
                            </div>

                            <div className="border-t border-[#E5E7EB] bg-white">
                              <div className="px-6 py-0.5">
                                <span className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1 text-[11px] font-bold text-[#374151] shadow-sm">
                                  Users
                                </span>
                              </div>

                              {filteredUserIds.length === 0 ? (
                                <div className="px-6 py-2 text-[12px] text-[#6B7280]">No users assigned.</div>
                              ) : (
                                <div className="flex flex-col pb-2">
                                  {filteredUserIds.map((id) => (
                                    <div
                                      key={`u-${g.id}-${id}`}
                                      className="relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1 pl-[60px] pr-5"
                                    >
                                      <div className="min-w-0 pr-2">
                                          <div className="absolute left-6 top-0.5 flex h-full w-8 items-center justify-center">
                                            <div className="absolute left-4 top-0 h-full w-[1.5px] bg-[#D1D5DB]" />
                                            <div className="absolute left-4 top-1/2 h-[1.5px] w-3 bg-[#D1D5DB]" />
                                          </div>
                                          <div className="pl-6 text-[14px] font-normal text-[#111827] whitespace-normal break-words">
                                            {resolveUserLabel(id)}
                                          </div>
                                      </div>
                                      <div className="flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border border-[#6C5DD3] bg-[#6C5DD3] text-white shadow-sm">
                                        <Check className="size-3.5 stroke-[3]" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="px-6 py-2">
                                <span className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-bold text-[#374151] shadow-sm">
                                  Jobpool
                                </span>
                              </div>

                              {jobPoolUserRows.length === 0 ? (
                                <div className="px-6 py-2 text-[12px] text-[#6B7280]">
                                  No jobpool users assigned.
                                </div>
                              ) : (
                                <div className="flex flex-col pb-2">
                                  {jobPoolUserRows.map((u) => (
                                    <div
                                      key={`jp-${g.id}-${u.id}`}
                                      className="relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1 pl-[60px] pr-5"
                                    >
                                      <div className="min-w-0 pr-2">
                                          <div className="absolute left-6 top-0.5 flex h-full w-8 items-center justify-center">
                                            <div className="absolute left-4 top-0 h-full w-[1.5px] bg-[#D1D5DB]" />
                                            <div className="absolute left-4 top-1/2 h-[1.5px] w-3 bg-[#D1D5DB]" />
                                          </div>
                                          <div className="pl-6 text-[14px] font-normal text-[#111827] whitespace-normal break-words">
                                            {u.label}
                                          </div>
                                      </div>
                                      <div className="flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border border-[#6C5DD3] bg-[#6C5DD3] text-white shadow-sm">
                                        <Check className="size-3.5 stroke-[3]" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )
              })()}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              className="h-10 min-w-[66px] rounded-[10px] bg-[#6C5DD3] px-5 text-[14px] font-medium text-white hover:bg-[#5D4FC4]"
              onClick={() => setUsersModalOpen(false)}
            >
              Ok
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
