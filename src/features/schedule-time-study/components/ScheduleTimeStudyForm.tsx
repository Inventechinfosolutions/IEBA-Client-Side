import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronDown, Eye, Search, Trash2, X } from "lucide-react"
import { useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  scheduleTimeStudyModalDefaultValues,
  scheduleTimeStudyModalFormSchema,
} from "../schemas"
import {
  DEFAULT_SCHEDULE_PARTICIPANT_GROUP_OPTIONS,
  DEPARTMENT_LABEL_MAP,
  FISCAL_YEAR_OPTIONS,
  getFiscalYearLabelFromMmDdYyyy,
} from "../types"
import type {
  ScheduleTimeStudyFormProps,
  ScheduleTimeStudyModalFormValues,
  ScheduledTimeStudyRow,
} from "../types"

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

export function ScheduleTimeStudyForm({
  open,
  onOpenChange,
  selectedDepartment,
  selectedStudyYear,
  periodRows,
  participantGroupOptions,
  onSave,
}: ScheduleTimeStudyFormProps) {
  const form = useForm<ScheduleTimeStudyModalFormValues>({
    resolver: zodResolver(scheduleTimeStudyModalFormSchema),
    defaultValues: {
      ...scheduleTimeStudyModalDefaultValues,
      department: selectedDepartment,
      studyYear: selectedStudyYear,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  })

  const studyYear = form.watch("studyYear")
  const entries = useWatch({ control: form.control, name: "entries" }) ?? []

  const [usersModalOpen, setUsersModalOpen] = useState(false)
  const [openGroupsDropdownIndex, setOpenGroupsDropdownIndex] = useState<number | null>(null)
  const [groupsSearch, setGroupsSearch] = useState("")

  const selectedDepartmentLabel = DEPARTMENT_LABEL_MAP[selectedDepartment] ?? "Social Services"

  const onSubmit = form.handleSubmit(
    (values) => {
      const rowsToSave: ScheduledTimeStudyRow[] = values.entries
        .filter((entry) => entry.timeStudyPeriod.trim().length > 0)
        .map((entry) => {
          const matchedPeriod = periodRows.find(
            (row) => row.timeStudyPeriod === entry.timeStudyPeriod
          )
          return {
            id: `scheduled-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timeStudyPeriod: entry.timeStudyPeriod,
            startDate: matchedPeriod?.startDate ?? "",
            endDate: matchedPeriod?.endDate ?? "",
            groups: entry.groups,
            status: entry.status,
          }
        })

      if (rowsToSave.length > 0) {
        onSave(rowsToSave)
      }

      onOpenChange(false)
      form.reset({
        ...scheduleTimeStudyModalDefaultValues,
        department: selectedDepartment,
        studyYear: selectedStudyYear,
      })
    },
    (errors) => {
      toast.error(getFirstNestedFormError(errors) ?? "Please fix the errors in the form")
    }
  )

  const getSelectedGroups = (value: string) =>
    value
      .split(",")
      .map((group) => group.trim())
      .filter(Boolean)

  const setSelectedGroups = (index: number, groups: string[]) => {
    const nextValue = groups.join(", ")
    form.setValue(`entries.${index}.groups`, nextValue, { shouldValidate: true })
  }

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

          <form onSubmit={onSubmit} className="space-y-5">
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
                      {FISCAL_YEAR_OPTIONS.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[14px] font-normal text-black">Select Department</Label>
                  <Input
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
                  append({ timeStudyPeriod: "", groups: "", status: "Draft" })
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
                          <div className="flex min-h-[40px] w-full items-center gap-1 rounded-[10px] border border-[#D1D5DB] px-2">
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                              {getSelectedGroups(groupsValue).map((group) => (
                                <span
                                  key={group}
                                  className="inline-flex max-w-[120px] items-center gap-1 rounded-[6px] bg-[#F3F4F6] px-2 py-0.5 text-[14px] text-[#111827]"
                                >
                                  <span className="truncate">{group}</span>
                                  <button
                                    type="button"
                                    className="text-[#9CA3AF]"
                                    onClick={() => {
                                      const nextGroups = getSelectedGroups(groupsValue).filter(
                                        (item) => item !== group
                                      )
                                      setSelectedGroups(index, nextGroups)
                                    }}
                                  >
                                    <X className="size-3.5" />
                                  </button>
                                </span>
                              ))}
                              <input
                                value={openGroupsDropdownIndex === index ? groupsSearch : ""}
                                onFocus={() => setOpenGroupsDropdownIndex(index)}
                                onChange={(event) => {
                                  setOpenGroupsDropdownIndex(index)
                                  setGroupsSearch(event.target.value)
                                }}
                                className="min-w-[80px] flex-1 bg-transparent text-[14px] outline-none"
                                placeholder={
                                  getSelectedGroups(groupsValue).length === 0 ? "Select group" : ""
                                }
                              />
                            </div>
                            <Search className="size-4 text-[#C4C4C4]" />
                            <button
                              type="button"
                              className="text-[#9CA3AF]"
                              onClick={() =>
                                setOpenGroupsDropdownIndex((prev) => (prev === index ? null : index))
                              }
                            >
                              <ChevronDown className="size-4" />
                            </button>
                          </div>

                          {openGroupsDropdownIndex === index ? (
                            <div className="absolute top-[calc(100%+8px)] z-50 w-full rounded-[14px] border border-[#E5E7EB] bg-white p-2 shadow-[0_8px_24px_#0000001A]">
                              <div className="space-y-1">
                                {groupOptions
                                  .filter((group) =>
                                    group.toLowerCase().includes(groupsSearch.trim().toLowerCase())
                                  )
                                  .map((group) => {
                                    const selectedGroups = getSelectedGroups(groupsValue)
                                    const isSelected = selectedGroups.includes(group)
                                    return (
                                      <button
                                        key={group}
                                        type="button"
                                        className="flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-[14px] hover:bg-[#F3F4F6]"
                                        onClick={() => {
                                          const nextGroups = isSelected
                                            ? selectedGroups.filter((item) => item !== group)
                                            : [...selectedGroups, group]
                                          setSelectedGroups(index, nextGroups)
                                        }}
                                      >
                                        <span>{group}</span>
                                        {isSelected ? (
                                          <Check className="size-4 text-[#6C5DD3]" />
                                        ) : null}
                                      </button>
                                    )
                                  })}
                                {groupOptions.filter((group) =>
                                  group.toLowerCase().includes(groupsSearch.trim().toLowerCase())
                                ).length === 0 ? (
                                  <div className="px-3 py-2 text-[14px] text-[#9CA3AF]">
                                    No groups found
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[14px] font-normal text-black">Users</Label>
                        <div className="flex h-[40px] items-center px-2 text-[#6C5DD3]">
                          <button
                            type="button"
                            onClick={() => setUsersModalOpen(true)}
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
                          {entry?.status ?? ""}
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
                type="submit"
                className="h-[42px] w-[88px] rounded-[10px] bg-[#6C5DD3] text-[16px] font-normal text-white hover:bg-[#5D4FC4]"
              >
                Submit
              </Button>
              <Button
                type="submit"
                className="h-[42px] w-[88px] rounded-[10px] bg-[#6C5DD3] text-[16px] font-normal text-white hover:bg-[#5D4FC4]"
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

      <Dialog open={usersModalOpen} onOpenChange={setUsersModalOpen}>
        <DialogContent
          showClose={false}
          className="w-[520px] max-w-[calc(100vw-2rem)] rounded-[8px] border border-[#E5E7EB] bg-white p-[14px_24px_16px]"
          overlayClassName="bg-black/45"
        >
          <DialogTitle className="text-center text-[25px] font-normal text-[#6C5DD3]">
            List of User in Group
          </DialogTitle>

          <div className="rounded-[8px] border border-[#E5E7EB]">
            <div className="h-10 rounded-t-[8px] bg-[#6C5DD3] px-4 py-2 text-[16px] font-medium text-white">
              List of Users
            </div>
            <div className="min-h-[360px] bg-white" />
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
