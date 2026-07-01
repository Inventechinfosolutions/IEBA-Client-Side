import { Triangle, SquarePen } from "lucide-react"
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
  { label: "Description", className: "w-[220px]" },
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
    <div className="space-y-4">
      {/* Table view for laptop & desktop (xl breakpoint and up) */}
      <div className="hidden xl:block w-full overflow-hidden rounded-[8px] border border-[#e7e9f0] bg-white">
        <div className="w-full overflow-x-auto ieba-scrollbar">
          <div className="min-w-[940px]">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {headers.map((header) => {
                    if (header.label === "Title") {
                      return (
                        <TableHead
                          key={header.label}
                          className={`h-10 bg-[#6c5dd3] p-[12px] text-left text-[12px] font-medium text-white border-r border-white/50 ${header.className ?? ""}`}
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
                        className={`h-10 bg-[#6c5dd3] p-[12px] text-center text-[12px] font-medium text-white border-r border-white/50 ${header.className ?? ""}`}
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
              <TableBody className="relative border-b-0">
                {isLoading ? (
                  <>
                    {/* Skeletons visible while loading */}
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <TableRow
                        key={`todo-skeleton-${idx}`}
                        className="ieba-skeleton-row h-[35px] border-[#e9ecf3] hover:bg-transparent"
                      >
                        <TableCell className="h-[35px] w-[160px] border-r border-[#eff0f5] bg-[#FAFAFA] px-3 py-1 align-middle">
                          <div className="h-4 w-full animate-pulse rounded bg-[#f0f2f8]" />
                        </TableCell>
                        <TableCell className="h-[35px] w-[220px] border-r border-[#eff0f5] px-3 py-1 align-middle">
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
                    ))}
                  </>
                ) : (
                  <>
                    {/* Data rows appearing after 200ms */}
                    {rows.length === 0 ? (
                      <TableRow className="ieba-data-row border-b-0 hover:bg-transparent">
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
                      rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="ieba-data-row h-[35px] border-[#e9ecf3] hover:bg-[#FAFAFA]"
                        >
                          <TableCell className="h-[35px] w-[160px] border-r border-[#eff0f5] bg-[#FAFAFA] px-3 py-1 align-middle text-[12px] leading-[14px] text-[#111827] whitespace-normal wrap-break-word">
                            {row.title}
                          </TableCell>
                          <TableCell className="h-[35px] w-[220px] max-w-[220px] border-r border-[#eff0f5] px-3 py-1 align-middle text-[12px] leading-[14px] text-[#111827] whitespace-normal wrap-break-word">
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
                      ))
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        {footer && (
          <div className="border-t border-[#e7e9f0] px-5 py-4 bg-white">
            {footer}
          </div>
        )}
      </div>

      {/* Cards view for mobile & tablet (screen widths < 1280px) */}
      <div className="xl:hidden space-y-4">
        {isLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`todo-card-skeleton-${idx}`}
                className="rounded-[8px] border border-[#e7e9f0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden animate-pulse"
              >
                {/* Header skeleton */}
                <div className="bg-[#6c5dd3]/75 px-4 py-3 flex items-center justify-between">
                  <div className="h-4 bg-white/40 rounded w-1/3" />
                  <div className="size-4 bg-white/40 rounded-[4px]" />
                </div>
                {/* Body skeleton */}
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                  </div>
                  <div className="border-b border-[#e9ecf3]" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                  <div className="border-b border-[#e9ecf3]" />
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-6 bg-gray-200 rounded-[8px] w-[65px]" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[8px] border border-[#e7e9f0] bg-white py-12 px-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <img
                  src={tableEmptyIcon}
                  alt="No data"
                  className="h-24 w-32 object-contain"
                />
                <p className="mt-2 text-[13px] text-gray-400">No to-do items found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-[8px] border border-[#e7e9f0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                  >
                    {/* Header */}
                    <div className="bg-[#6c5dd3] px-4 py-2.5 text-white flex items-center justify-between">
                      <h3 className="text-[14px] font-semibold leading-tight break-words pr-2">
                        {row.title}
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditRow(row)}
                        className="size-7 cursor-pointer text-white hover:bg-white/10 hover:text-white rounded-[4px] p-0"
                      >
                        <SquarePen className="size-[15px] stroke-[1.8]" />
                      </Button>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-4">
                      {/* Description */}
                      <div className="space-y-1">
                        <span className="text-[12px] font-medium text-[#8f93a1]">Description</span>
                        <p className="text-[13px] text-[#111827] leading-relaxed break-words whitespace-pre-wrap">
                          {row.description || <span className="italic text-gray-400">No description</span>}
                        </p>
                      </div>
                      
                      <div className="border-b border-[#e9ecf3]" />

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[12px] font-medium text-[#8f93a1]">Created Date</span>
                          <span className="text-[13px] text-[#111827] block">{row.createdDate || "-"}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[12px] font-medium text-[#8f93a1]">Completed Date</span>
                          <span className="text-[13px] text-[#111827] block">{row.completedDate || "-"}</span>
                        </div>
                      </div>

                      <div className="border-b border-[#e9ecf3]" />

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-[#8f93a1]">Status</span>
                        <span
                          className={`inline-flex h-[24px] min-w-[65px] items-center justify-center rounded-[8px] border px-2.5 text-center text-[12px] ${getStatusPillClasses(
                            row.status
                          )}`}
                        >
                          {TODO_STATUS_LABEL[row.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Render pagination footer below cards on mobile */}
            {footer && (
              <div className="w-full mt-4">
                {footer}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

