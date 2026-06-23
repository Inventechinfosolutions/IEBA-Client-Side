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
    <div className="w-full space-y-4">
      {/* Mobile & Tablet Card View (hidden on lg screens) */}
      <div className="block lg:hidden space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`mobile-skeleton-${idx}`}
                className="rounded-[8px] border border-[#e7e9f0] bg-white shadow-sm overflow-hidden"
              >
                {/* Purple header skeleton */}
                <div className="bg-[#6c5dd3]/80 px-4 py-2.5 flex items-center justify-between">
                  <div className="h-4 bg-white/30 rounded w-1/3 animate-pulse" />
                  <div className="size-7 bg-white/20 rounded-[6px]" />
                </div>
                {/* Body skeleton */}
                <div className="p-4 space-y-3">
                  <div className="h-10 bg-[#f0f2f8] rounded w-full animate-pulse" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-8 bg-[#f0f2f8] rounded animate-pulse" />
                    <div className="h-8 bg-[#f0f2f8] rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between items-center border-t border-[#f3f4f6] pt-3">
                    <div className="h-4 bg-[#f0f2f8] rounded w-1/4 animate-pulse" />
                    <div className="h-5 bg-[#f0f2f8] rounded w-[53px] animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-[8px] border border-[#e7e9f0] bg-white p-8 text-center shadow-sm">
            <div className="flex items-center justify-center">
              <img
                src={tableEmptyIcon}
                alt="No data"
                className="h-24 w-32 object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[500px]:grid-cols-2 gap-4">
            {rows.map((row) => (
              <div
                key={row.id}
                className="rounded-[8px] border border-[#e7e9f0] bg-white shadow-sm overflow-hidden relative hover:shadow-md transition-shadow duration-200"
              >
                {/* Purple header matching desktop table headers */}
                <div className="bg-[#6c5dd3] px-4 py-2.5 flex items-center justify-between gap-4">
                  <h3 className="font-medium text-[13px] leading-tight text-white break-words flex-1">
                    {row.title}
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditRow(row)}
                    className="size-7 cursor-pointer rounded-[6px] text-white hover:bg-white/10 shrink-0"
                  >
                    <SquarePen className="size-[14.5px] text-white" />
                  </Button>
                </div>
                
                <div className="p-4 space-y-3">
                  {row.description && (
                    <div className="pb-3 border-b border-[#f3f4f6]">
                      <span className="block font-medium text-gray-400 mb-1 text-[11px]">Description</span>
                      <p className="text-[12px] leading-relaxed text-[#4b5563] whitespace-pre-wrap break-words">
                        {row.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-[11px] text-[#6b7280]">
                    <div>
                      <span className="block font-medium text-gray-400 mb-0.5">Created Date</span>
                      <span className="text-[#111827] text-[12px]">{row.createdDate || "-"}</span>
                    </div>
                    <div>
                      <span className="block font-medium text-gray-400 mb-0.5">Completed Date</span>
                      <span className="text-[#111827] text-[12px]">{row.completedDate || "-"}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#f3f4f6] pt-3">
                    <span className="text-[11px] font-medium text-gray-400">Status</span>
                    <span
                      className={`inline-flex h-[20px] min-w-[53px] items-center justify-center rounded-[8px] border px-1.5 text-center text-[11px] ${getStatusPillClasses(
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
        
        {footer && <div className="mt-4">{footer}</div>}
      </div>

      {/* Desktop & Laptop Table View (visible on lg screens and above) */}
      <div className="hidden lg:block overflow-hidden rounded-[8px] border border-[#e7e9f0] bg-white">
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
          <TableBody className="relative">
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
                  ))
                )}
              </>
            )}
            <TableRow className="h-[120px] hover:bg-transparent">
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
    </div>
  )
}

