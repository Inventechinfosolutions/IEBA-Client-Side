import { Eye, Trash2 } from "lucide-react"
import { useState } from "react"

import editIconImg from "@/assets/edit-icon.png"
import statusCheckImg from "@/assets/status-check.png"
import statusCrossImg from "@/assets/status-cross.png"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetParticipantsListRows } from "../queries/getScheduleTimeStudyPeriods"
import { FISCAL_YEAR_OPTIONS } from "../types"
import type { ParticipantsListRow, ParticipantsListTableProps } from "../types"
import { ParticipantsListForm, ParticipantUsersModal } from "./ParticipantsListForm"

export function ParticipantsListTable({
  studyYear,
  selectedDepartment,
  onStudyYearChange,
}: ParticipantsListTableProps) {
  const participantsQuery = useGetParticipantsListRows()
  const [hasRowsChanges, setHasRowsChanges] = useState(false)
  const [rows, setRows] = useState<ParticipantsListRow[]>([])
  const effectiveRows = hasRowsChanges ? rows : (participantsQuery.data ?? [])
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [usersModalOpen, setUsersModalOpen] = useState(false)
  const [editingParticipantRow, setEditingParticipantRow] = useState<ParticipantsListRow | null>(
    null
  )

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-[20px] font-normal leading-none text-[#6C5DD3]">Participant List</h3>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <Select value={studyYear} onValueChange={onStudyYearChange}>
          <SelectTrigger className="h-12 w-[150px] rounded-[10px] border-[#D1D5DB] px-[11px] text-[14px] text-[#111827]">
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

        <Button
          type="button"
          className="h-10 w-[175px] rounded-[12px] bg-[#6C5DD3] px-[15px] text-[14px] font-normal text-white hover:bg-[#5D4FC4]"
          onClick={() => setCreateGroupOpen(true)}
        >
          Add Participant Group
        </Button>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB]">
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
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center justify-center gap-3">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-4" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              : effectiveRows.map((row) => (
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
                <TableCell className="px-3 py-2">
                  <div className="flex items-center justify-center gap-3">
                    {row.canView ? (
                      <>
                        <img
                          src={statusCrossImg}
                          alt="Cross"
                          className="h-4 w-4 object-contain"
                        />
                        <button type="button" onClick={() => setUsersModalOpen(true)}>
                          <Eye className="size-4 text-[#6C5DD3]" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingParticipantRow(row)
                            setCreateGroupOpen(true)
                          }}
                        >
                          <img src={editIconImg} alt="Edit" className="h-4 w-4 object-contain" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHasRowsChanges(true)
                            setRows(effectiveRows.filter((tableRow) => tableRow.id !== row.id))
                          }}
                        >
                          <Trash2 className="size-4 text-[#DC2626]" />
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

      <div className="mt-8 flex min-h-[64px] w-full items-center justify-end rounded-[15px] bg-white px-4 py-4 shadow-[0_0_20px_0_#0000001a]">
        <Pagination className="mx-0 w-[740px] justify-end">
          <PaginationContent className="gap-0">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text=""
                onClick={(event) => event.preventDefault()}
                className="h-9 w-9 rounded-[8px] border border-transparent px-0 text-[#9CA3AF] pointer-events-none opacity-60"
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                href="#"
                isActive
                onClick={(event) => event.preventDefault()}
                className="h-9 w-9 rounded-[8px] border border-[#D1D5DB] bg-white px-0 text-[18px] font-normal text-[#4B5563]"
              >
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                text=""
                onClick={(event) => event.preventDefault()}
                className="h-9 w-9 rounded-[8px] border border-transparent px-0 text-[#9CA3AF] pointer-events-none opacity-60"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

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
        selectedStudyYear={studyYear}
        editingRow={editingParticipantRow}
        onSave={(row) => {
          setHasRowsChanges(true)
          setRows(
            (() => {
              const sourceRows = effectiveRows
              const existingIndex = sourceRows.findIndex((item) => item.id === row.id)
              if (existingIndex >= 0) {
                return sourceRows.map((item) => (item.id === row.id ? row : item))
              }
              return [row, ...sourceRows]
            })()
          )
        }}
      />
      <ParticipantUsersModal open={usersModalOpen} onOpenChange={setUsersModalOpen} />
    </div>
  )
}
