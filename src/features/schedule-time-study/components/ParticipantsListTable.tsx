import { Eye, Trash2, Check } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import editIconImg from "@/assets/edit-icon.png"
import statusCheckImg from "@/assets/status-check.png"
import statusCrossImg from "@/assets/status-cross.png"
import { Button } from "@/components/ui/button"
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { SingleSelectDropdown } from "@/components/ui/dropdown"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { useDeleteRmtsGroup } from "../mutations/deleteRmtsGroup"
import { formatRmtsGroupMutationError } from "../utils/rmtsGroupMutationMessages"
import { useGetRmtsGroups } from "../queries/getRmtsGroups"
import { useGetRmtsGroupById } from "../queries/getRmtsGroupById"
import type { ParticipantsListRow, ParticipantsListTableProps } from "../types"
import { ParticipantsListForm, ParticipantUsersModal } from "./ParticipantsListForm"
import { ParticipantsListCardView } from "./ParticipantsListCardView"

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

export function ParticipantsListTable({
  studyYear,
  selectedDepartment,
  selectedDepartmentName,
  departmentId,
  fiscalYearOptions,
  onStudyYearChange,
}: ParticipantsListTableProps) {
  const participantsQuery = useGetRmtsGroups({ departmentId, fiscalyear: studyYear })
  const deleteGroup = useDeleteRmtsGroup()
  const rows = participantsQuery.data?.rows ?? []

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [prevQueryKey, setPrevQueryKey] = useState("")
  const queryKey = `${departmentId}-${studyYear}`
  if (queryKey !== prevQueryKey) {
    setCurrentPage(1)
    setPrevQueryKey(queryKey)
  }

  const paginatedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [usersModalOpen, setUsersModalOpen] = useState(false)
  const [viewGroupId, setViewGroupId] = useState<number | null>(null)
  const [editingParticipantRow, setEditingParticipantRow] = useState<ParticipantsListRow | null>(
    null,
  )

  const groupByIdQuery = useGetRmtsGroupById({ id: usersModalOpen ? viewGroupId : null })

  const assignedUserIds = groupByIdQuery.data?.users ?? []

  const assignedUsers = useMemo(() => {
    return assignedUserIds.map((nameOrId) => ({
      id: nameOrId,
      label: nameOrId,
    }))
  }, [assignedUserIds])

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-[20px] font-normal leading-none text-[#6C5DD3]">Participant List</h3>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
        <SingleSelectDropdown
          value={studyYear}
          onChange={onStudyYearChange}
          onBlur={() => {}}
          options={fiscalYearOptions.map((fy) => ({ value: fy.id, label: fy.label }))}
          placeholder="Select year"
          className="h-10 w-full sm:w-[170px] rounded-[10px] border-[#D1D5DB] px-[12px] text-[14px] font-normal text-[#111827] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        <Button
          type="button"
          className="h-10 w-full sm:w-[175px] shrink-0 rounded-[12px] bg-[#6C5DD3] px-[15px] text-[14px] font-normal text-white hover:bg-[#5D4FC4]"
          onClick={() => setCreateGroupOpen(true)}
        >
          Add Participant Group
        </Button>
      </div>

      <ParticipantsListCardView
        rows={rows}
        isLoading={participantsQuery.isLoading}
        onEditRow={(row) => {
          setEditingParticipantRow(row)
          setCreateGroupOpen(true)
        }}
        onDeleteRow={(row) => {
          const id = Number(row.id)
          if (!Number.isFinite(id) || id <= 0) return
          void deleteGroup
            .mutateAsync(id)
            .then(() => {
              toast.success("Deleted successfully", participantGroupSuccessToastOptions)
            })
            .catch((error: unknown) => {
              toast.error(formatRmtsGroupMutationError(error))
            })
        }}
        onViewUsers={(row) => {
          setViewGroupId(Number(row.id))
          setUsersModalOpen(true)
        }}
        isDeletingId={deleteGroup.isPending ? Number(editingParticipantRow?.id) : null}
      />

      <div className="hidden xl:block relative overflow-hidden rounded-[10px] border border-[#E5E7EB]">
        {participantsQuery.isFetching && (
          <div className="absolute top-[60px] inset-x-0 bottom-0 flex items-center justify-center bg-white/50 z-[50]">
            <Spinner className="text-[#6C5DD3]" />
          </div>
        )}
        <Table className="w-full table-fixed">
          <colgroup>
            <col className="w-[39%]" />
            <col className="w-[16%]" />
            <col className="w-[18%]" />
            <col className="w-[11%]" />
            <col className="w-[16%]" />
          </colgroup>
          <TableHeader>
            <TableRow className="h-[60px] bg-[#6C5DD3] hover:bg-[#6C5DD3]">
              {["Group Name", "Job Pool", "Cost Pool", "User", "Action"].map((header) => (
                <TableHead
                  key={header}
                  className="h-[60px] border-r border-[#FFFFFF66] bg-[#6C5DD3] px-[12px] text-center text-[12px] font-normal text-white first:text-left last:border-r-0"
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {participantsQuery.isLoading
              ? Array.from({ length: 6 }, (_, index) => (
                  <TableRow key={`participants-skeleton-${index}`} className="h-[44px] border-[#EDEDED]">
                    <TableCell className="border-r border-[#E5E7EB] px-4 py-2">
                      <Skeleton className="h-4 w-[75%]" />
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-center">
                      <Skeleton className="mx-auto h-4 w-4" />
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-center">
                      <Skeleton className="mx-auto h-4 w-4" />
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-center">
                      <Skeleton className="mx-auto h-4 w-4" />
                    </TableCell>
                    <TableCell className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-4" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-[145px] bg-white text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-[#9CA3AF]">
                        <img src={tableEmptyIcon} alt="" className="size-[80px] object-contain" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedRows.map((row) => (
                  <TableRow key={row.id} className="h-[44px] border-[#EDEDED]">
                    <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-[13px] text-[#111827]">
                      {row.groupName}
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-center">
                      {row.jobPool ? (
                        <img
                          src={statusCheckImg}
                          alt="Yes"
                          className="mx-auto h-4 w-4 object-contain"
                        />
                      ) : (
                        <img
                          src={statusCrossImg}
                          alt="No"
                          className="mx-auto h-4 w-4 object-contain"
                        />
                      )}
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-center">
                      {row.costPool ? (
                        <img
                          src={statusCheckImg}
                          alt="Yes"
                          className="mx-auto h-4 w-4 object-contain"
                        />
                      ) : (
                        <img
                          src={statusCrossImg}
                          alt="No"
                          className="mx-auto h-4 w-4 object-contain"
                        />
                      )}
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-center">
                      {row.user ? (
                        <img
                          src={statusCheckImg}
                          alt="Yes"
                          className="mx-auto h-4 w-4 object-contain"
                        />
                      ) : (
                        <img
                          src={statusCrossImg}
                          alt="No"
                          className="mx-auto h-4 w-4 object-contain"
                        />
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {row.isUsed === true ? (
                          <>
                            <span
                              className="inline-flex shrink-0 cursor-not-allowed opacity-80"
                              title="This participant group is already in use"
                              role="img"
                              aria-label="This participant group is already in use"
                            >
                              <img
                                src={statusCrossImg}
                                alt=""
                                className="h-4 w-4 object-contain"
                                aria-hidden
                              />
                            </span>
                            <button
                              type="button"
                              className="inline-flex shrink-0 cursor-pointer rounded p-0.5 text-[#9CA3AF] transition-colors hover:text-[#6B7280] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#9CA3AF]"
                              aria-label={`View users in ${row.groupName}`}
                              onClick={() => {
                                const id = Number(row.id)
                                if (!Number.isFinite(id) || id <= 0) return
                                setViewGroupId(id)
                                setUsersModalOpen(true)
                              }}
                            >
                              <Eye className="size-4" strokeWidth={2} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="inline-flex shrink-0 cursor-pointer rounded p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#6C5DD3]"
                              aria-label={`Edit ${row.groupName}`}
                              onClick={() => {
                                setEditingParticipantRow(row)
                                setCreateGroupOpen(true)
                              }}
                            >
                              <img src={editIconImg} alt="" className="h-4 w-4 object-contain" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex shrink-0 cursor-pointer rounded p-0.5 text-[#DC2626] transition-colors hover:text-[#B91C1C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#DC2626] disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={deleteGroup.isPending}
                              aria-label={`Delete ${row.groupName}`}
                              onClick={() => {
                                const id = Number(row.id)
                                if (!Number.isFinite(id) || id <= 0) return
                                void deleteGroup
                                  .mutateAsync(id)
                                  .then(() => {
                                    toast.success(
                                      "Deleted successfully",
                                      participantGroupSuccessToastOptions,
                                    )
                                  })
                                  .catch((error: unknown) => {
                                    toast.error(formatRmtsGroupMutationError(error))
                                  })
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <MasterCodePagination
        totalItems={rows.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
      />

      <ParticipantsListForm
        key={editingParticipantRow ? `edit-${editingParticipantRow.id}` : "create-participant"}
        open={createGroupOpen}
        onOpenChange={(nextOpen) => {
          setCreateGroupOpen(nextOpen)
          if (!nextOpen) {
            setEditingParticipantRow(null)
          }
        }}
        selectedDepartment={selectedDepartment}
        selectedDepartmentName={selectedDepartmentName}
        selectedStudyYear={studyYear}
        departmentId={departmentId}
        fiscalYearOptions={fiscalYearOptions}
        editingRow={editingParticipantRow}
      />
      <ParticipantUsersModal
        open={usersModalOpen}
        onOpenChange={(next) => {
          setUsersModalOpen(next)
          if (!next) {
            setViewGroupId(null)
          }
        }}
        title={
          groupByIdQuery.data?.name
            ? `List of User in Group — ${groupByIdQuery.data.name}`
            : "List of User in Group"
        }
        departmentLabel={selectedDepartmentName}
        loading={groupByIdQuery.isFetching}
        users={assignedUsers}
        grouptype={groupByIdQuery.data?.grouptype as any}
      />
    </div>
  )
}
