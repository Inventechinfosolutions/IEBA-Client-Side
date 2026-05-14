import { useState } from "react"
import { Spinner } from "@/components/ui/spinner"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import {
  PROGRAM_DEFINITION_HISTORY_KIND,
  USER_ASSIGNMENT_HISTORY_KIND,
  useUserProgramHistoryQuery,
  type UserProgramHistoryRecord,
} from "../queries/userProgramHistory"
import {
  getProgramHistoryCreatedAtDisplay,
  getProgramHistoryCreatedByDisplay,
  getProgramHistoryEffectiveFromDisplay,
  getProgramHistoryEffectiveToDisplay,
  getProgramHistoryEventDisplay,
  getProgramHistoryUpdatedAtDisplay,
  getProgramHistoryUpdatedByDisplay,
} from "../lib/userProgramHistoryDisplay"

type UserProgramHistoryTableProps = {
  userId?: string
  programCode?: string
  /** Defaults to `program_definition` for Time Study program definition history. */
  historyKind?: string
  /** Overrides the default heading for this `historyKind`. */
  sectionTitle?: string
}

const DEFINITION_HEADERS = [
  "Program Code",
  "Program Name",
  "Program Event",
  "Created By Name",
  "Created At",
  "Updated By Name",
  "Updated At",
] as const

const ASSIGNMENT_HEADERS = ["Program Code", "Program Name", "Effective From", "Effective To"] as const

const COL_WIDTHS_DEFINITION = ["12%", "18%", "12%", "14%", "14%", "14%", "16%"] as const
const COL_WIDTHS_ASSIGNMENT = ["18%", "32%", "25%", "25%"] as const

export function UserProgramHistoryTable({
  userId = "",
  programCode = "",
  historyKind = PROGRAM_DEFINITION_HISTORY_KIND,
  sectionTitle,
}: UserProgramHistoryTableProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const isUserAssignmentHistory = historyKind === USER_ASSIGNMENT_HISTORY_KIND
  const headers = isUserAssignmentHistory ? ASSIGNMENT_HEADERS : DEFINITION_HEADERS
  const colWidths = isUserAssignmentHistory ? COL_WIDTHS_ASSIGNMENT : COL_WIDTHS_DEFINITION

  const resolvedSectionTitle =
    sectionTitle ??
    (isUserAssignmentHistory ? "Time study assignment history" : "Program definition history")

  const { data, isLoading } = useUserProgramHistoryQuery({
    page,
    limit: pageSize,
    programCode,
    userId,
    historyKind,
  })

  const historyData: UserProgramHistoryRecord[] = Array.isArray(data?.data) ? data.data : []
  const totalItems = data?.meta?.totalItems ?? 0

  const skeletonRows = Array.from({ length: pageSize }, (_, i) => `history-skeleton-${i}`)

  const leftAlignThroughIndex = isUserAssignmentHistory ? 1 : 2

  return (
    <div className="flex flex-col gap-4 pt-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-[#111827]">{resolvedSectionTitle}</h3>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB]">
        <div className="relative min-h-[300px] overflow-x-auto">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60">
              <Spinner className="text-[#6C5DD3]" />
            </div>
          )}
          <Table className="w-full table-fixed border-collapse">
            <colgroup>
              {colWidths.map((w, i) => (
                <col key={`program-history-col-${i}`} style={{ width: w }} />
              ))}
            </colgroup>
            <TableHeader className="sticky top-0 z-10 bg-[#6C5DD3] shadow-[0_1px_0_rgba(0,0,0,0.05)] [&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                {headers.map((header, idx) => (
                  <TableHead
                    key={header}
                    className={`h-[48px] bg-[#6C5DD3] px-[14px] text-[14px] font-[500] text-white font-['Roboto',sans-serif] whitespace-normal wrap-break-word leading-snug ${
                      idx <= leftAlignThroughIndex ? "text-left" : "text-center"
                    } ${idx === headers.length - 1 ? "" : "border-r border-white/40"}`}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? skeletonRows.map((rowId) => (
                    <TableRow
                      key={rowId}
                      className="h-10 border-b border-[#E5E7EB] hover:bg-transparent"
                    >
                      {headers.map((_, i) => (
                        <TableCell
                          key={i}
                          className={`border-r border-[#E5E7EB] px-[14px] py-[10px] text-[12px] last:border-r-0 ${
                            i <= leftAlignThroughIndex ? "text-left" : "text-center"
                          }`}
                        >
                          <Skeleton
                            className={`h-3 ${i <= leftAlignThroughIndex ? "" : "mx-auto"} ${
                              i === 1 ? "w-[85%]" : i === 0 ? "w-[60%]" : isUserAssignmentHistory ? "w-[55%]" : i === 2 ? "w-[75%]" : "w-[50%]"
                            }`}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : historyData.map((row) => (
                    <TableRow key={row.id} className="min-h-[40px] border-b border-[#E5E7EB] hover:bg-[#fafafa]">
                      {isUserAssignmentHistory ? (
                        <>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {row.programCode ?? "—"}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {row.programName ?? "—"}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {getProgramHistoryEffectiveFromDisplay(row)}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] text-[#232735] last:border-r-0 whitespace-normal wrap-break-word">
                            {getProgramHistoryEffectiveToDisplay(row)}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {row.programCode ?? "—"}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {row.programName ?? "—"}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {getProgramHistoryEventDisplay(row)}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {getProgramHistoryCreatedByDisplay(row)}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {getProgramHistoryCreatedAtDisplay(row)}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {getProgramHistoryUpdatedByDisplay(row)}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] text-[#232735] last:border-r-0 whitespace-normal wrap-break-word">
                            {getProgramHistoryUpdatedAtDisplay(row)}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
              {!isLoading && historyData.length === 0 ? (
                <TableRow className="h-[210px] hover:bg-transparent">
                  <TableCell colSpan={headers.length} className="text-center">
                    <img
                      src={tableEmptyIcon}
                      alt="No history found"
                      className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
                    />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      {!isLoading && totalItems > 0 && (
        <MasterCodePagination
          totalItems={totalItems}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setPage(1)
          }}
        />
      )}
    </div>
  )
}
