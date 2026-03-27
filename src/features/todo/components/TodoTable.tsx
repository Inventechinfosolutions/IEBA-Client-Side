import { ChevronDown, ChevronUp } from "lucide-react"
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
import type { TodoRow, TodoTableProps } from "../types"

const headers: { label: string; className?: string }[] = [
  { label: "Title", className: "w-[160px]" },
  { label: "Description", className: "w-[360px]" },
  { label: "Created Date", className: "w-[160px]" },
  { label: "Completed Date", className: "w-[160px]" },
  { label: "Status", className: "w-[120px]" },
]

function getStatusPillClasses(status: TodoRow["status"]) {
  if (status === "New") return "border-[#3b82f6] text-black"
  if (status === "In progress") return "border-[#f59e0b] text-black"
  return "border-[#16a34a] text-black"
}

export function TodoTable({
  rows,
  isLoading,
  titleSortState,
  onToggleTitleSort,
  onEditRow,
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
                    className={`h-10 bg-[#6c5dd3] p-[12px] text-left text-[11px] font-medium text-white ${
                      "border-r border-[#6C5DD3]"
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
                            <span className="pointer-events-none absolute right-[12px] inline-flex flex-col items-center leading-none">
                              <ChevronUp
                                className={`size-[10px] ${
                                  titleSortState === "asc"
                                    ? "text-white"
                                    : "text-white/50"
                                }`}
                              />
                              <ChevronDown
                                className={`-mt-1 size-[10px] ${
                                  titleSortState === "desc"
                                    ? "text-white"
                                    : "text-white/50"
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
                  className={`h-10 bg-[#6c5dd3] p-[12px] text-center text-[11px] font-medium text-white ${
                    "border-r border-[#6C5DD3]"
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
            <TableHead className="h-10 w-[120px] bg-[#6c5dd3] p-[12px] text-center text-[11px] font-medium text-white">
              <div className="flex h-full w-full items-center justify-center text-center">
                Action
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <TableRow key={`todo-loading-${idx}`} className="h-11 border-[#e9ecf3] hover:bg-transparent">
                <TableCell className="w-[160px] border-r border-[#eff0f5] px-3">
                  <div className="h-4 w-full animate-pulse rounded bg-[#f0f2f8]" />
                </TableCell>
                <TableCell className="w-[360px] border-r border-[#eff0f5] px-3">
                  <div className="h-4 w-full animate-pulse rounded bg-[#f0f2f8]" />
                </TableCell>
                <TableCell className="w-[160px] border-r border-[#eff0f5] px-3">
                  <div className="h-4 w-full animate-pulse rounded bg-[#f0f2f8]" />
                </TableCell>
                <TableCell className="w-[160px] border-r border-[#eff0f5] px-3">
                  <div className="h-4 w-full animate-pulse rounded bg-[#f0f2f8]" />
                </TableCell>
                <TableCell className="w-[120px] border-r border-[#eff0f5] px-3">
                  <div className="h-4 w-full animate-pulse rounded bg-[#f0f2f8]" />
                </TableCell>
                <TableCell className="w-[120px] px-2">
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
                <TableRow key={row.id} className="min-h-[44px] border-[#e9ecf3] hover:bg-transparent">
                  <TableCell className="w-[160px] align-top border-r border-[#eff0f5] px-3 text-[12px] text-[#111827] whitespace-normal break-words">
                    {row.title}
                  </TableCell>
                  <TableCell className="w-[360px] max-w-[360px] align-top border-r border-[#eff0f5] px-3 text-[12px] text-[#111827] whitespace-normal break-words">
                    {row.description || "-"}
                  </TableCell>
                  <TableCell className="w-[160px] border-r border-[#eff0f5] px-3 text-center text-[12px] text-[#111827]">
                    {row.createdDate || "-"}
                  </TableCell>
                  <TableCell className="w-[160px] border-r border-[#eff0f5] px-3 text-center text-[12px] text-[#111827]">
                    {row.completedDate || "-"}
                  </TableCell>
                  <TableCell className="w-[120px] border-r border-[#eff0f5] px-3 text-center">
                    <span
                      className={`inline-flex min-w-[80px] justify-center rounded-[10px] border px-2 py-0.5 text-center text-[12px] ${getStatusPillClasses(
                        row.status
                      )}`}
                    >
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell className="w-[120px] px-2 text-center">
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
              <TableRow className="h-[120px] border-t border-[#e9ecf3] hover:bg-transparent">
                <TableCell colSpan={6} className="p-0" />
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

