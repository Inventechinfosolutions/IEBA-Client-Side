import { Check } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import { RmtsGroupType } from "../enums/schedule-time-study.enum"
import { useCreateRmtsGroup } from "../mutations/createRmtsGroup"
import { useUpdateRmtsGroup } from "../mutations/updateRmtsGroup"
import { useGetScheduleTimeStudyUsersByDepartment } from "../queries/getScheduleTimeStudyUsersByDepartment"
import { useGetScheduleTimeStudyJobPoolsByDepartment } from "../queries/getScheduleTimeStudyJobPoolsByDepartment"
import { useGetRmtsGroupById } from "../queries/getRmtsGroupById"
import {
  participantsListFormDefaultValues,
  participantsListFormSchema,
} from "../schemas"
import { formatRmtsGroupMutationError } from "../utils/rmtsGroupMutationMessages"
import type {
  ParticipantUsersModalProps,
  ParticipantsListFormProps,
  ParticipantsListFormValues,
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

export function ParticipantsListForm({
  open,
  onOpenChange,
  selectedDepartment,
  selectedDepartmentName,
  selectedStudyYear,
  departmentId,
  fiscalYearOptions,
  editingRow,
}: ParticipantsListFormProps) {
  const initialValues: ParticipantsListFormValues = editingRow
    ? {
        groupName: editingRow.groupName,
        department: selectedDepartment,
        studyYear: selectedStudyYear,
        selectedUserBy:
          editingRow.grouptype === RmtsGroupType.User ? "user" : "job-pool",
      }
    : {
        ...participantsListFormDefaultValues,
        department: selectedDepartment,
        studyYear: selectedStudyYear,
      }

  const form = useForm<ParticipantsListFormValues>({
    resolver: zodResolver(participantsListFormSchema),
    defaultValues: initialValues,
  })

  const createGroup = useCreateRmtsGroup()
  const updateGroup = useUpdateRmtsGroup()

  const groupName = form.watch("groupName")
  const studyYear = form.watch("studyYear")
  const selectedUserBy = form.watch("selectedUserBy")
  const selectedDepartmentLabel =
    selectedDepartmentName.trim() || (selectedDepartment.trim() ? "—" : "")

  const usersQuery = useGetScheduleTimeStudyUsersByDepartment({
    departmentId: open ? departmentId : null,
  })
  const departmentUsers = usersQuery.data ?? []

  const jobPoolsQuery = useGetScheduleTimeStudyJobPoolsByDepartment({
    departmentId: selectedUserBy === "job-pool" && open ? departmentId : null,
    enabled: selectedUserBy === "job-pool" && open,
  })
  const jobPools = jobPoolsQuery.data ?? []

  const [manualUserIds, setManualUserIds] = useState<string[] | null>(null)
  const [manualJobPoolUserIds, setManualJobPoolUserIds] = useState<string[] | null>(null)
  const [manualJobPoolIds, setManualJobPoolIds] = useState<string[] | null>(null)

  const groupDetailsQuery = useGetRmtsGroupById({
    id: editingRow?.id ? Number(editingRow.id) : null,
  })

  const selectedUserIds = useMemo(() => {
    if (manualUserIds !== null) return manualUserIds
    if (open && editingRow?.grouptype === RmtsGroupType.User && groupDetailsQuery.data?.users) {
      return groupDetailsQuery.data.users
    }
    return []
  }, [manualUserIds, open, editingRow, groupDetailsQuery.data])

  const selectedJobPoolIds = useMemo(() => {
    if (manualJobPoolIds !== null) return manualJobPoolIds
    if (open && editingRow?.grouptype === RmtsGroupType.JobPool && groupDetailsQuery.data?.jobPools) {
      return groupDetailsQuery.data.jobPools
    }
    return []
  }, [manualJobPoolIds, open, editingRow, groupDetailsQuery.data])

  const selectedJobPoolUserIds = useMemo(() => {
    if (manualJobPoolUserIds !== null) return manualJobPoolUserIds
    if (open && editingRow?.grouptype === RmtsGroupType.JobPool && groupDetailsQuery.data?.users) {
      return groupDetailsQuery.data.users
    }
    return []
  }, [manualJobPoolUserIds, open, editingRow, groupDetailsQuery.data])


  const toggleUserAll = (checked: boolean) => {
    setManualUserIds(checked ? departmentUsers.map((u) => u.id) : [])
  }

  const toggleJobPoolOne = (jobPoolId: string, checked: boolean) => {
    const jp = jobPools.find((j) => j.id === jobPoolId)
    const userIdsInPool = (jp?.userprofiles ?? []).map((u) => u.id)

    setManualJobPoolIds((prev) => {
      const current = prev ?? (editingRow?.grouptype === RmtsGroupType.JobPool ? groupDetailsQuery.data?.jobPools ?? [] : [])
      const has = current.includes(jobPoolId)
      if (checked) return has ? current : [...current, jobPoolId]
      return has ? current.filter((x) => x !== jobPoolId) : current
    })

    setManualJobPoolUserIds((prev) => {
      const current = prev ?? (editingRow?.grouptype === RmtsGroupType.JobPool ? groupDetailsQuery.data?.users ?? [] : [])
      if (checked) {
        const next = [...current]
        userIdsInPool.forEach((id) => {
          if (!next.includes(id)) next.push(id)
        })
        return next
      } else {
        return current.filter((id) => !userIdsInPool.includes(id))
      }
    })
  }
 
  const toggleUserOne = (userId: string, jobPoolId?: string) => {
    if (selectedUserBy === "job-pool") {
      setManualJobPoolUserIds((prev) => {
        const current = prev ?? (editingRow?.grouptype === RmtsGroupType.JobPool ? groupDetailsQuery.data?.users ?? [] : [])
        return current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
      })
      if (jobPoolId) {
        setManualJobPoolIds((prev) => {
          const current = prev ?? (editingRow?.grouptype === RmtsGroupType.JobPool ? groupDetailsQuery.data?.jobPools ?? [] : [])
          return current.includes(jobPoolId) ? current : [...current, jobPoolId]
        })
      }
    } else {
      setManualUserIds((prev) => {
        const current = prev ?? (editingRow?.grouptype === RmtsGroupType.User ? groupDetailsQuery.data?.users ?? [] : [])
        return current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
      })
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (departmentId == null || departmentId <= 0) {
      toast.error("Department is not ready for saving. Try again in a moment.")
      return
    }

    const grouptype =
      values.selectedUserBy === "user" ? RmtsGroupType.User : RmtsGroupType.JobPool

    const payload = {
      name: values.groupName.trim(),
      fiscalyear: values.studyYear,
      grouptype,
      departmentId,
      ...(values.selectedUserBy === "user"
        ? { users: selectedUserIds }
        : { jobPools: selectedJobPoolIds, users: selectedJobPoolUserIds }),
    }

    try {
      if (editingRow) {
        const id = Number(editingRow.id)
        if (!Number.isFinite(id) || id <= 0) {
          throw new Error("Invalid participant group id")
        }
        await updateGroup.mutateAsync({
          id,
          body: payload,
        })
        toast.success("Participant group updated successfully", participantGroupSuccessToastOptions)
      } else {
        await createGroup.mutateAsync(payload)
        toast.success("Participant group created successfully", participantGroupSuccessToastOptions)
      }
      onOpenChange(false)
      form.reset({
        ...participantsListFormDefaultValues,
        department: selectedDepartment,
        studyYear: selectedStudyYear,
      })
      setManualUserIds(null)
      setManualJobPoolUserIds(null)
      setManualJobPoolIds(null)

    } catch (error) {
      toast.error(formatRmtsGroupMutationError(error))
    }
  })

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setManualUserIds(null)
          setManualJobPoolUserIds(null)
          setManualJobPoolIds(null)
        }
        onOpenChange(isOpen)
      }}
    >
      <DialogContent
        showClose={false}
        className="min-h-[520px] w-[980px] max-w-[calc(100vw-2rem)] rounded-[6px] border border-[#E5E7EB] bg-white p-[18px_26px_24px]"
        overlayClassName="bg-black/45"
      >
        <DialogTitle className="text-center text-[17px] font-medium text-[#6C5DD3]">
          {editingRow ? "Edit Participant Group" : "Create Participant Group"}
        </DialogTitle>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="mx-auto mt-4 flex w-fit items-end justify-center gap-5">
            <div className="w-[180px] space-y-1">
              <Label className="text-[14px] font-normal text-black">Group Name</Label>
              <TitleCaseInput
                className={`!h-12 w-full rounded-[10px] border-[#D1D5DB] text-[14px] ${
                  form.formState.errors.groupName ? "border-red-500" : ""
                }`}
                value={groupName}
                onChange={(event) =>
                  form.setValue("groupName", event.target.value, {
                    shouldValidate: true,
                  })
                }
              />
              {form.formState.errors.groupName && (
                <p className="text-[11px] text-red-500">
                  {form.formState.errors.groupName.message}
                </p>
              )}
            </div>

            <div className="w-[180px] space-y-1">
              <Label className="text-[14px] font-normal text-black">Select Department</Label>
              <TitleCaseInput
                readOnly
                value={selectedDepartmentLabel}
                className="!h-12 w-full cursor-not-allowed rounded-[10px] border-[#D1D5DB] bg-[#F9FAFB] text-[14px] text-[#111827]"
              />
            </div>

            <div className="w-[180px] space-y-1">
              <Label className="text-[14px] font-normal text-black">Select Year</Label>
              <Select
                value={studyYear}
                onValueChange={(value) =>
                  form.setValue("studyYear", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="!h-12 w-full rounded-[10px] border-[#D1D5DB] px-[11px] py-0 text-[14px] data-[size=default]:!h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  avoidCollisions={false}
                  sideOffset={10}
                  align="start"
                  className="rounded-[10px] border border-[#E5E7EB] p-1"
                >
                  {fiscalYearOptions.map((fy) => (
                    <SelectItem key={fy.id} value={fy.id}>
                      {fy.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[180px] space-y-2">
              <Label className="text-[14px] font-normal text-black">Select User By</Label>
              <RadioGroup
                value={selectedUserBy}
                onValueChange={(value) =>
                  form.setValue("selectedUserBy", value as "job-pool" | "user", {
                    shouldValidate: true,
                  })
                }
                className="flex h-12 items-center gap-5"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="job-pool" 
                    id="job-pool" 
                    disabled={!!editingRow}
                    className={editingRow ? "cursor-not-allowed opacity-50" : ""}
                  />
                  <Label 
                    htmlFor="job-pool" 
                    className={`text-[14px] font-normal text-black ${editingRow ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    Job Pool
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="user" 
                    id="user" 
                    disabled={!!editingRow}
                    className={editingRow ? "cursor-not-allowed opacity-50" : ""}
                  />
                  <Label 
                    htmlFor="user" 
                    className={`text-[14px] font-normal text-black ${editingRow ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    User
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="mx-auto w-[600px] overflow-hidden rounded-[8px] border border-[#E5E7EB]">
            <div className="h-10 bg-[#6C5DD3] px-4 py-2 text-[15px] font-medium text-white">
              {selectedUserBy === "user"
                ? "All User List (Assigned)"
                : "Job Pool Users (Assigned)"}
            </div>
            <div className="min-h-[450px] bg-white">
              {selectedUserBy === "job-pool" ? (
                jobPoolsQuery.isPending ? (
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div key={`jobpools-skel-${i}`} className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4 rounded-[4px]" />
                        <Skeleton className="h-4 w-[75%]" />
                      </div>
                    ))}
                  </div>
                ) : jobPoolsQuery.isError ? (
                  <div className="flex min-h-[450px] items-center justify-center px-6 text-[14px] text-[#DC2626]">
                    Failed to load job pools.
                  </div>
                ) : jobPools.length === 0 ? (
                  <div className="flex min-h-[450px] items-center justify-center px-6 text-[14px] text-[#6B7280]">
                    No job pools found for this department.
                  </div>
                ) : (
                  <div className="p-4">
                    <ScrollArea className="h-[396px] pb-2">
                        <div className="flex flex-col">
                          {jobPools.map((jp) => {
                            const users = jp.userprofiles ?? []
                            return (
                              <div key={jp.id} className="border-b border-[#f1f3f7] last:border-b-0">
                                {/* Job pool name row (grey like UAT) */}
                                <div className="grid h-7 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-[#F3F4F6] pl-4 pr-5 text-[12px] font-semibold text-[#374151]">
                                  <span className="min-w-0">{jp.name || "—"}</span>
                                  <button
                                    type="button"
                                    aria-label={
                                      selectedJobPoolIds.includes(jp.id)
                                        ? `Deselect job pool ${jp.name ?? ""}`
                                        : `Select job pool ${jp.name ?? ""}`
                                    }
                                    onClick={() =>
                                      toggleJobPoolOne(jp.id, !selectedJobPoolIds.includes(jp.id))
                                    }
                                    className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
                                      selectedJobPoolIds.includes(jp.id)
                                        ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                                        : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                                    }`}
                                  >
                                    <Check className="size-3.5 stroke-[3]" />
                                  </button>
                                </div>

                                <div className="px-6 py-0.5">
                                  <span className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-bold text-[#374151] shadow-sm">
                                    Job Pool
                                  </span>
                                </div>

                                {/* Users list with tree lines */}
                                <div className="flex flex-col pb-2">
                                  {users.map((u) => {
                                    const deptUser = departmentUsers.find((du) => du.id === u.id)
                                    const label =
                                      (u.name ?? "").trim() ||
                                      `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
                                      (deptUser?.name ?? "").trim() ||
                                      `${deptUser?.firstName ?? ""} ${deptUser?.lastName ?? ""}`.trim() ||
                                      (deptUser?.user?.loginId ?? "").trim() ||
                                      u.id
                                    return (
                                      <div
                                        key={u.id}
                                        className={`group relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1 pl-[60px] pr-5 text-left transition-colors ${
                                          selectedJobPoolIds.includes(jp.id)
                                            ? "bg-[#F3F0FF]"
                                            : "hover:bg-[#F9FAFB]"
                                        }`}
                                      >
                                        <div className="min-w-0 pr-2">
                                          <div className="absolute left-6 top-0.5 flex h-full w-8 items-center justify-center">
                                            <div className="absolute left-4 top-0 h-full w-[1.5px] bg-[#D1D5DB]" />
                                            <div className="absolute left-4 top-1/2 h-[1.5px] w-3 bg-[#D1D5DB]" />
                                          </div>
                                          <div className="pl-6 text-[14px] font-normal text-[#111827] whitespace-normal break-words">
                                            {label}
                                          </div>
                                        </div>
                                        <div
                                          className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
                                            selectedJobPoolIds.includes(jp.id)
                                              ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                                              : "border-[#E5E7EB] bg-[#F3F4F6] text-transparent hover:border-[#D1D5DB]"
                                          }`}
                                        >
                                          <Check className="size-3.5 stroke-[3]" />
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  )
              ) : selectedUserBy !== "user" ? (
                <div className="flex min-h-[450px] items-center justify-center px-6 text-[14px] text-[#6B7280]">
                  Select “User” to load department users.
                </div>
              ) : usersQuery.isPending ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={`users-skel-${i}`} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4 rounded-[4px]" />
                      <Skeleton className="h-4 w-[75%]" />
                    </div>
                  ))}
                </div>
              ) : usersQuery.isError ? (
                <div className="flex min-h-[450px] items-center justify-center px-6 text-[14px] text-[#DC2626]">
                  Failed to load users.
                </div>
              ) : departmentUsers.length === 0 ? (
                <div className="flex min-h-[450px] items-center justify-center px-6 text-[14px] text-[#6B7280]">
                  No users found for this department.
                </div>
              ) : (
                <div className="p-4">
                    {/* Department row */}
                    <div className="grid h-7 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-[#F3F4F6] pl-4 pr-5 text-[12px] font-semibold text-[#374151]">
                      <span className="min-w-0">{selectedDepartmentLabel || "—"}</span>
                      <button
                        type="button"
                        aria-label={
                          selectedUserIds.length === departmentUsers.length
                            ? "Deselect all users"
                            : "Select all users"
                        }
                        onClick={() =>
                          toggleUserAll(selectedUserIds.length !== departmentUsers.length)
                        }
                        className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
                          departmentUsers.length > 0 &&
                          selectedUserIds.length === departmentUsers.length
                            ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                            : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                        }`}
                      >
                        <Check className="size-3.5 stroke-[3]" />
                      </button>
                    </div>

                    {/* Roles list */}
                    <div className="border-t border-[#E5E7EB] bg-white">
                      <ScrollArea className="h-[360px] pb-2">
                        <div className="flex flex-col">
                          <div className="px-6 py-0.5">
                            <span className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-bold text-[#374151] shadow-sm">
                              Users
                            </span>
                          </div>
                          {departmentUsers.map((u) => {
                            const label =
                              (u.name ?? "").trim() ||
                              `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
                              (u.user?.loginId ?? "").trim() ||
                              "—"
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => toggleUserOne(u.id)}
                                className={`group relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1 pl-[60px] pr-5 text-left transition-colors ${
                                  selectedUserIds.includes(u.id)
                                    ? "bg-[#F3F0FF]"
                                    : "hover:bg-[#F9FAFB]"
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="absolute left-6 top-0.5 flex h-full w-8 items-center justify-center">
                                    <div className="absolute left-4 top-0 h-full w-[1.5px] bg-[#D1D5DB]" />
                                    <div className="absolute left-4 top-1/2 h-[1.5px] w-3 bg-[#D1D5DB]" />
                                  </div>
                                  <div className="pl-6 text-[14px] font-normal text-[#111827] whitespace-normal break-words">
                                    {label}
                                  </div>
                                </div>
                                <div
                                  className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
                                    selectedUserIds.includes(u.id)
                                      ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                                      : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                                  }`}
                                >
                                  <Check className="size-3.5 stroke-[3]" />
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              className="h-10 w-[86px] rounded-[6px] bg-[#6C5DD3] text-[14px] font-medium text-white hover:bg-[#5D4FC4]"
            >
              Save
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-10 w-[86px] rounded-[6px] bg-[#D9D9D9] text-[14px] font-medium text-black hover:bg-[#CDCDCD]"
              onClick={() => onOpenChange(false)}
            >
              Exit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ParticipantUsersModal({
  open,
  onOpenChange,
  title,
  departmentLabel,
  loading,
  users,
  grouptype,
}: ParticipantUsersModalProps) {
  const list = users ?? []
  const dept = (departmentLabel ?? "").trim() || "—"
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="w-[600px] max-w-[calc(100vw-2rem)] rounded-[8px] border border-[#E5E7EB] bg-white p-[14px_24px_16px]"
        overlayClassName="bg-black/45"
      >
        <DialogTitle className="text-center text-[25px] font-normal text-[#6C5DD3]">
          {title?.trim() ? title : "List of User in Group"}
        </DialogTitle>

        <div className="rounded-[8px] border border-[#E5E7EB]">
          <div className="h-10 rounded-t-[8px] bg-[#6C5DD3] px-4 py-2 text-[16px] font-medium text-white">
            List of Users
          </div>
          <div className="min-h-[360px] bg-white">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={`users-in-group-skel-${i}`} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded-[4px]" />
                    <Skeleton className="h-4 w-[75%]" />
                  </div>
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="flex min-h-[360px] items-center justify-center px-6 text-[14px] text-[#6B7280]">
                No users assigned.
              </div>
            ) : (
              <div className="p-4">
                  <div className="grid h-7 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-[#F3F4F6] pl-4 pr-5 text-[12px] font-semibold text-[#374151]">
                    <span className="min-w-0">{dept}</span>
                    <Checkbox
                      checked={false}
                      className="size-4.5 shrink-0 rounded-[6px] border-[#E5E7EB] bg-white opacity-60 pointer-events-none"
                    />
                  </div>
                  <div className="border-t border-[#E5E7EB] bg-white">
                    <ScrollArea className="h-[360px] pb-2">
                      <div className="flex flex-col">
                        <div className="px-6 py-0.5">
                          <span className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1 text-[11px] font-bold text-[#374151] shadow-sm">
                            {grouptype === "job-pool" ? "Job Pool" : "Users"}
                          </span>
                        </div>
                        {list.map((u) => (
                          <div
                            key={u.id}
                            className="relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-[#F3F0FF] py-1 pl-[60px] pr-5 text-left"
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
                    </ScrollArea>
                  </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            className="h-10 min-w-[66px] rounded-[10px] bg-[#6C5DD3] px-5 text-[14px] font-medium text-white hover:bg-[#5D4FC4]"
            onClick={() => onOpenChange(false)}
          >
            Ok
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
