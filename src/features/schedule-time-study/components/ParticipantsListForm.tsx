import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  participantsListFormDefaultValues,
  participantsListFormSchema,
} from "../schemas"
import { DEPARTMENT_LABEL_MAP, FISCAL_YEAR_OPTIONS } from "../types"
import type {
  ParticipantUsersModalProps,
  ParticipantsListFormProps,
  ParticipantsListFormValues,
} from "../types"

export function ParticipantsListForm({
  open,
  onOpenChange,
  selectedDepartment,
  selectedStudyYear,
  editingRow,
  onSave,
}: ParticipantsListFormProps) {
  const initialValues: ParticipantsListFormValues = editingRow
    ? {
        groupName: editingRow.groupName,
        department: selectedDepartment,
        studyYear: selectedStudyYear,
        selectedUserBy: editingRow.user ? "user" : "job-pool",
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

  const groupName = form.watch("groupName")
  const studyYear = form.watch("studyYear")
  const selectedUserBy = form.watch("selectedUserBy")
  const selectedDepartmentLabel = DEPARTMENT_LABEL_MAP[selectedDepartment] ?? "Social Services"

  const onSubmit = form.handleSubmit((values) => {
    onSave({
      id: editingRow?.id ?? `participant-${Date.now()}`,
      groupName: values.groupName.trim(),
      jobPool: values.selectedUserBy === "job-pool",
      costPool: editingRow?.costPool ?? false,
      user: values.selectedUserBy === "user",
      canView: editingRow?.canView ?? false,
    })
    onOpenChange(false)
    form.reset({
      ...participantsListFormDefaultValues,
      department: selectedDepartment,
      studyYear: selectedStudyYear,
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <Input
                className="!h-12 w-full rounded-[10px] border-[#D1D5DB] text-[14px]"
                value={groupName}
                onChange={(event) =>
                  form.setValue("groupName", event.target.value, {
                    shouldValidate: true,
                  })
                }
              />
            </div>

            <div className="w-[180px] space-y-1">
              <Label className="text-[14px] font-normal text-black">Select Department</Label>
              <Input
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
                  {FISCAL_YEAR_OPTIONS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
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
                <label className="flex items-center gap-2 text-[14px] text-black">
                  <RadioGroupItem value="job-pool" />
                  Job Pool
                </label>
                <label className="flex items-center gap-2 text-[14px] text-black">
                  <RadioGroupItem value="user" />
                  User
                </label>
              </RadioGroup>
            </div>
          </div>

          <div className="mx-auto w-[600px] overflow-hidden rounded-[8px] border border-[#E5E7EB]">
            <div className="h-10 bg-[#6C5DD3] px-4 py-2 text-[15px] font-medium text-white">
              {selectedUserBy === "user"
                ? "All User List (Assigned)"
                : "Job Pool Users (Assigned)"}
            </div>
            <div className="min-h-[450px] bg-white" />
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

export function ParticipantUsersModal({ open, onOpenChange }: ParticipantUsersModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={() => onOpenChange(false)}
          >
            Ok
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
