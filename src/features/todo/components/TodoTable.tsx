import { Triangle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import tableEditIcon from "@/assets/icons/table-edit.png"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TodoStatusEnum } from "../enums/todoStatus"
import { TODO_STATUS_LABEL } from "../types"
import type { TodoRow, TodoTableProps } from "../types"

const headers: { label: string; className?: string }[] = [
  { label: "Title", className: "w-[160px]" },
  { label: "Description", className: "w-[360px]" },
  { label: "Created Date", className: "w-[160px]" },
  { label: "Completed Date", className: "w-[160px]" },
  { label: "Status", className: "w-[120px]" },
]

function getStatusPillClasses(status: TodoRow["status"]) {
  if (status === TodoStatusEnum.NEW) return "border-[#d1d5db] text-black"
  if (status === TodoStatusEnum.INPROGRESS) return "border-[#f59e0b] text-black"
  return "border-[#16a34a] text-black"
}

export function TodoTable({
  rows,
  isLoading,
  titleSortState,
  onToggleTitleSort,
  onEditRow,
  footer,
}: TodoTableProps) {
  const [isTitleTooltipOpen, setIsTitleTooltipOpen] = useState(false)

  return (
    <div className="overflow-hidden rounded-[8px] border border-[#e7e9f0] bg-white">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {headers.map((header) => {
              if (header.label === "Title") {
                return (
                  <TableHead
                    key={header.label}
                    className={`h-10 bg-[#6c5dd3] p-[12px] text-left text-[12px] font-medium text-white ${
                      "border-r border-white/50"
                    } ${header.className ?? ""}`}
                  >
                    <TooltipProvider>
                      <Tooltip open={isTitleTooltipOpen}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={onToggleTitleSort}
                            onMouseEnter={() => setIsTitleTooltipOpen(true)}
                            onMouseLeave={() => setIsTitleTooltipOpen(false)}
                            onFocus={() => setIsTitleTooltipOpen(true)}
                            onBlur={() => setIsTitleTooltipOpen(false)}
                            className="relative flex h-full w-full cursor-pointer items-center justify-start pr-4 text-white"
                          >
                            <span>Title</span>
                            <span className="pointer-events-none absolute right-[8px] inline-flex flex-col items-center gap-px leading-none">
                              <Triangle
                                className={`size-[6px] fill-white stroke-white ${
                                  titleSortState === "asc" ? "opacity-100" : "opacity-50"
                                }`}
                              />
                              <Triangle
                                className={`size-[6px] rotate-180 fill-white stroke-white ${
                                  titleSortState === "desc" ? "opacity-100" : "opacity-50"
                                }`}
                              />
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6}>
                          {titleSortState === "none"
                            ? "Click to sort ascending"
                            : titleSortState === "asc"
                              ? "Click to sort descending"
                              : "Click to cancel sorting"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                )
              }

              return (
                <TableHead
                  key={header.label}
                  className={`h-10 bg-[#6c5dd3] p-[12px] text-center text-[12px] font-medium text-white ${
                    "border-r border-white/50"
                  } ${header.className ?? ""}`}
                >
                  <div
                    className={`flex h-full w-full items-center ${
                      header.label === "Description"
                        ? "justify-start text-left"
                        : "justify-center text-center"
                    }`}
                  >
                    {header.label}
                  </div>
                </TableHead>
              )
            })}
            <TableHead className="h-10 w-[120px] bg-[#6c5dd3] p-[12px] text-center text-[12px] font-medium text-white border-white/50 border-r-0">
              <div className="flex h-full w-full items-center justify-center text-center">
                Action
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <TableRow key={`todo-loading-${idx}`} className="h-[35px] border-[#e9ecf3] hover:bg-transparent">
                <TableCell className="h-[35px] w-[160px] border-r border-[#eff0f5] bg-[#FAFAFA] px-3 py-1 align-middle">
                  <div className="h-4 w-full animate-pulse rounded bg-[#f0f2f8]" />
                </TableCell>
                <TableCell className="h-[35px] w-[360px] border-r border-[#eff0f5] px-3 py-1 align-middle">
                  <div className="h-4 w-full animate-pulse rounded bg-[#f0f2f8]" />
                </TableCell>
                <TableCell className="h-[35px] w-[160px] border-r border-[#eff0f5] px-3 py-1 align-middle">
                  <div className="h-4 w-full animate-pulse rounded bg-[#f0f2f8]" />
                </TableCell>
                <TableCell className="h-[35px] w-[160px] border-r border-[#eff0f5] px-3 py-1 align-middle">
                  <div className="h-4 w-full animate-pulse rounded bg-[#f0f2f8]" />
                </TableCell>
                <TableCell className="h-[35px] w-[120px] border-r border-[#eff0f5] px-3 py-1 align-middle">
                  <div className="h-4 w-full animate-pulse rounded bg-[#f0f2f8]" />
                </TableCell>
                <TableCell className="h-[35px] w-[120px] px-2 py-1 align-middle">
                  <div className="h-4 w-full animate-pulse rounded bg-[#f0f2f8]" />
                </TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="h-[250px] p-0">
                <div className="h-full">
                  <div className="flex h-[126px] items-center justify-center border-b border-[#eff0f5]">
                    <img
                      src={tableEmptyIcon}
                      alt="No data"
                      className="h-24 w-32 object-contain"
                    />
                  </div>
                  <div className="h-[94px]" />
                </div>
              </TableCell>
            </TableRow>
          ) : (
            <>
              {rows.map((row) => (
                <TableRow key={row.id} className="h-[35px] border-[#e9ecf3] hover:bg-[#FAFAFA]">
                  <TableCell className="h-[35px] w-[160px] border-r border-[#eff0f5] bg-[#FAFAFA] px-3 py-1 align-middle text-[12px] leading-[14px] text-[#111827] whitespace-normal wrap-break-word">
                    {row.title}
                  </TableCell>
                  <TableCell className="h-[35px] w-[360px] max-w-[360px] border-r border-[#eff0f5] px-3 py-1 align-middle text-[12px] leading-[14px] text-[#111827] whitespace-normal wrap-break-word">
                    {row.description || "-"}
                  </TableCell>
                  <TableCell className="h-[35px] w-[160px] border-r border-[#eff0f5] px-3 py-1 align-middle text-center text-[12px] leading-[14px] text-[#111827]">
                    {row.createdDate || "-"}
                  </TableCell>
                  <TableCell className="h-[35px] w-[160px] border-r border-[#eff0f5] px-3 py-1 align-middle text-center text-[12px] leading-[14px] text-[#111827]">
                    {row.completedDate || "-"}
                  </TableCell>
                  <TableCell className="h-[35px] w-[120px] border-r border-[#eff0f5] px-3 py-1 align-middle text-center">
                    <span
                      className={`inline-flex h-[20px] min-w-[53px] items-center justify-center rounded-[8px] border px-1.5 text-center text-[11px] ${getStatusPillClasses(
                        row.status
                      )}`}
                    >
                      {TODO_STATUS_LABEL[row.status]}
                    </span>
                  </TableCell>
                  <TableCell className="h-[35px] w-[120px] px-2 py-1 align-middle text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditRow(row)}
                      className="size-7 cursor-pointer rounded-[6px] text-[#6b7280] hover:bg-[#f7f8fc]"
                    >
                      <img
                        src={tableEditIcon}
                        alt=""
                        aria-hidden="true"
                        className="size-[14.5px] object-contain"
                      />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </>
          )}
          <TableRow className="h-[120px] border-t border-[#e9ecf3] hover:bg-transparent">
            <TableCell colSpan={6} className="p-0">
              {footer ? (
                <div className="flex h-[120px] w-full items-end px-5 pb-4">
                  <div className="w-full">{footer}</div>
                </div>
              ) : (
                <div className="h-[120px]" />
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

