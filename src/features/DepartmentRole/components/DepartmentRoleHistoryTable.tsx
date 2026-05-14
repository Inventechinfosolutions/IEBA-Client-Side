import { useState } from "react"

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
  DEPARTMENT_ROLE_DEFINITION_HISTORY_KIND,
  useDepartmentRoleHistoryQuery,
  type DepartmentRoleHistoryRecord,
} from "../queries/departmentRoleHistory"
import {
  getDepartmentRoleHistoryCreatedAtDisplay,
  getDepartmentRoleHistoryCreatedByDisplay,
  getDepartmentRoleHistoryEffectiveFromDisplay,
  getDepartmentRoleHistoryEffectiveToDisplay,
  getDepartmentRoleHistoryUpdatedAtDisplay,
  getDepartmentRoleHistoryUpdatedByDisplay,
} from "../lib/departmentRoleHistoryDisplay"

type DepartmentRoleHistoryTableProps = {
  departmentName?: string
  departmentCode?: string
  roleName?: string
  /** Required for `user_assignment` history (e.g. User → Security/Assignments). */
  userId?: string
  /** Defaults to `department_role_definition` for Department Role module history. */
  historyKind?: string
  /**
   * `audit` — definition-style columns (code + name + role + created/updated by/at).
   * `assignment` — department name, role name, effective from/to (user assignment history).
   */
  columnLayout?: "audit" | "assignment"
}

const AUDIT_HEADERS = [
  "Department Code",
  "Department Name",
  "Role Name",
  "Created By Name",
  "Updated By Name",
  "Created At",
  "Updated At",
] as const

const ASSIGNMENT_HEADERS = [
  "Department Name",
  "Role Name",
  "Effective From",
  "Effective To",
] as const

const COL_WIDTHS_AUDIT = ["12%", "18%", "14%", "14%", "14%", "14%", "14%"] as const
const COL_WIDTHS_ASSIGNMENT = ["28%", "32%", "20%", "20%"] as const

export function DepartmentRoleHistoryTable({
  departmentName = "",
  departmentCode = "",
  roleName = "",
  userId = "",
  historyKind = DEPARTMENT_ROLE_DEFINITION_HISTORY_KIND,
  columnLayout = "audit",
}: DepartmentRoleHistoryTableProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const isAssignmentLayout = columnLayout === "assignment"
  const headers = isAssignmentLayout ? ASSIGNMENT_HEADERS : AUDIT_HEADERS
  const colWidths = isAssignmentLayout ? COL_WIDTHS_ASSIGNMENT : COL_WIDTHS_AUDIT
  const leftAlignThroughIndex = isAssignmentLayout ? 1 : 2

  const { data, isLoading } = useDepartmentRoleHistoryQuery({
    page,
    limit: pageSize,
    departmentCode: departmentCode,
    departmentName: departmentName,
    roleName: roleName,
    historyKind,
    userId,
  })

  const historyData: DepartmentRoleHistoryRecord[] = Array.isArray(data?.data) ? data.data : []
  const totalItems = data?.meta?.totalItems ?? 0

  const skeletonRows = Array.from({ length: pageSize }, (_, i) => `history-skeleton-${i}`)

  return (
    <div className="flex flex-col gap-4 pt-3">
      <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB]">
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed border-collapse">
            <colgroup>
              {colWidths.map((w, i) => (
                <col key={`dept-role-history-col-${i}`} style={{ width: w }} />
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
                              i === 1
                                ? "w-[85%]"
                                : i === 0
                                  ? "w-[60%]"
                                  : isAssignmentLayout
                                    ? "w-[55%]"
                                    : i === 2
                                      ? "w-[70%]"
                                      : "w-[45%]"
                            }`}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : historyData.map((row, idx) => (
                    <TableRow
                      key={`${row.id}-${idx}`}
                      className="min-h-[40px] border-b border-[#E5E7EB] hover:bg-[#fafafa]"
                    >
                      {isAssignmentLayout ? (
                        <>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {row.departmentName || "—"}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {row.roleName || "—"}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {getDepartmentRoleHistoryEffectiveFromDisplay(row)}
                          </TableCell>
                          <TableCell className="px-[14px] py-[10px] text-center text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] last:border-r-0 whitespace-normal break-words">
                            {getDepartmentRoleHistoryEffectiveToDisplay(row)}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {row.departmentCode || "—"}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {row.departmentName || "—"}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {row.roleName || "—"}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {getDepartmentRoleHistoryCreatedByDisplay(row)}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {getDepartmentRoleHistoryUpdatedByDisplay(row)}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {getDepartmentRoleHistoryCreatedAtDisplay(row)}
                          </TableCell>
                          <TableCell className="px-[14px] py-[10px] text-center text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] last:border-r-0 whitespace-normal break-words">
                            {getDepartmentRoleHistoryUpdatedAtDisplay(row)}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}

              {!isLoading && historyData.length === 0 && (
                <TableRow className="h-[210px] hover:bg-transparent">
                  <TableCell colSpan={headers.length} className="text-center">
                    <img
                      src={tableEmptyIcon}
                      alt="No history found"
                      className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
                    />
                  </TableCell>
                </TableRow>
              )}
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
