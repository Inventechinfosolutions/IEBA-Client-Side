import { Fragment, useState } from "react"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { DepartmenRoleTableProps } from "../types"
import { cn } from "@/lib/utils"
import statusCheckImg from "@/assets/status-check.png"
import statusCrossImg from "@/assets/status-cross.png"

const PAGE_SIZES = [5, 10, 25, 50] as const

export function DepartmenRoleTable({
  data,
  pagination,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onToggleChildStatus,
  onOptionAction,
  isLoading = false,
}: DepartmenRoleTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totalPages = Math.max(
    1,
    Math.ceil(pagination.totalItems / pagination.pageSize)
  )
  /** Server returns one page per request; `data` is already the current page. */
  const rows = data

  return (
    <div className="min-h-[360px] overflow-hidden rounded-[10px] border-[0.5px] border-[rgb(218,218,218)] bg-[rgb(255,255,255)]">
      <Table className="w-full border-collapse rounded-[15px]">
        <TableHeader>
          <TableRow className="border-0 border-b-0 bg-[#6C5DD3] hover:bg-[#6C5DD3]">
            <TableHead className="w-[15%] border-0 border-r border-white bg-[#6C5DD3] px-[1%] py-3 text-left font-medium text-sm text-white rounded-tl-[10px] first:rounded-tl-[10px]">
              Department
            </TableHead>
            <TableHead className="w-[65%] border-0 border-r border-white bg-[#6C5DD3] py-3 pl-[2%] text-left font-medium text-sm text-white">
              Roles
            </TableHead>
            <TableHead className="w-[10%] border-0 border-r border-white bg-[#6C5DD3] p-3 text-center font-medium text-sm text-white">
              Status
            </TableHead>
            <TableHead className="w-[10%] border-0 bg-[#6C5DD3] p-3 text-center font-medium text-sm text-white rounded-tr-[10px] last:rounded-tr-[10px]">
              Option
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: pagination.pageSize }, (_, i) => (
              <TableRow
                key={`skeleton-${i}`}
                className="border-b border-[#f0f0f0] hover:bg-transparent"
              >
                <TableCell className="w-[15%] align-middle p-2 pl-[1%]">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-5 shrink-0 rounded" />
                    <Skeleton className="h-4 max-w-[140px] flex-1" />
                  </div>
                </TableCell>
                <TableCell className="w-[65%] align-middle py-2 pl-[1%]">
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-7 w-24 rounded-[10px]" />
                    <Skeleton className="h-7 w-28 rounded-[10px]" />
                    <Skeleton className="h-7 w-20 rounded-[10px]" />
                  </div>
                </TableCell>
                <TableCell className="w-[10%] p-2 text-center">
                  <Skeleton className="mx-auto size-[18px] rounded-full" />
                </TableCell>
                <TableCell className="w-[10%] p-2 text-center">
                  <Skeleton className="mx-auto size-8 rounded-md" />
                </TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-8 text-center text-muted-foreground"
              >
                No department roles found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const isExpanded = expandedIds.has(row.id)
              const hasChildren = row.children && row.children.length > 0
              return (
                <Fragment key={row.id}>
                  <TableRow
                    key={row.id}
                    className={cn(
                      "border-[#f0f0f0]",
                      !(hasChildren && isExpanded) && "border-b"
                    )}
                  >
                    <TableCell className="w-[15%] align-middle p-2 pl-[1%] text-sm">
                      <div className="flex items-center gap-2">
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(row.id)}
                            className="flex shrink-0 items-center justify-center rounded p-0.5 hover:bg-muted"
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? (
                              <ChevronDownIcon className="size-4" />
                            ) : (
                              <ChevronRightIcon className="size-4" />
                            )}
                          </button>
                        ) : (
                          <span className="inline-block w-5" />
                        )}
                        <span>{row.departmentName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[65%] align-middle py-2 pl-[1%] text-sm whitespace-normal">
                      <div className="flex flex-wrap gap-2">
                        {row.roles.map((role) => (
                          <span
                            key={role}
                            className="my-0 mx-[0.5%] inline-block rounded-[10px] border-[0.5px] border-solid border-[rgb(217,217,217)] bg-[rgb(255,255,255)] px-[2%] py-[0.75%] text-[12px] text-[#000000E0]"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="w-[10%] align-middle p-2 text-center text-sm">
                      <div className="flex justify-center">
                        {row.status === "active" ? (
                          <img
                            src={statusCheckImg}
                            alt="Active"
                            className="h-[18px] w-[18px] shrink-0 cursor-pointer object-contain"
                            aria-label="Active"
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-[10%] align-middle p-2 text-center">
                      <div className="flex justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                              aria-label="More options"
                            >
                              <MoreVerticalIcon className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[120px]">
                            <DropdownMenuItem
                              onClick={() => onOptionAction?.(row.id, "add")}
                              className="cursor-pointer text-black focus:text-black"
                            >
                              <PlusIcon className="mr-2 size-4 text-[rgb(108,93,211)]" />
                              Add
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onOptionAction?.(row.id, "delete")}
                              className="cursor-pointer text-black focus:text-black"
                            >
                              <Trash2Icon className="mr-2 size-4 text-[rgb(108,93,211)]" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                  {hasChildren &&
                    isExpanded && (
                      <TableRow className="border-b-0 bg-transparent hover:bg-transparent">
                        <TableCell
                          colSpan={4}
                          className="border-0 p-0 align-top"
                        >
                          <div className="bg-muted/30">
                            {row.children?.map((child) => (
                              <div
                                key={child.id}
                                className="flex w-full items-center py-[0.125%] text-sm"
                              >
                                <div className="flex w-[15%] min-w-0 items-center gap-2 pl-[1%] pr-2">
                                  <Checkbox
                                    checked={child.status === "active"}
                                    disabled={child.autoselected}
                                    onCheckedChange={(checked) => {
                                      if (child.autoselected) return
                                      onToggleChildStatus?.(child.id, checked === true)
                                    }}
                                    className={cn(
                                      "border-[#6C5DD3] data-[state=checked]:border-[#6C5DD3] data-[state=checked]:bg-[#6C5DD3]",
                                      child.autoselected && "cursor-not-allowed opacity-60"
                                    )}
                                  />
                                  <span>{child.roleName}</span>
                                </div>
                                <div className="w-[65%] shrink-0" />
                                <div className="flex w-[10%] shrink-0 justify-center px-2">
                                  <img
                                    src={
                                      child.status === "active"
                                        ? statusCheckImg
                                        : statusCrossImg
                                    }
                                    alt={child.status === "active" ? "Active" : "Inactive"}
                                    className="h-[18px] w-[18px] shrink-0 object-contain"
                                    aria-label={
                                      child.status === "active" ? "Active" : "Inactive"
                                    }
                                  />
                                </div>
                                <div className="flex w-[10%] shrink-0 justify-center px-2">
                                  {child.autoselected ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                                      aria-label="View"
                                      onClick={() => onView?.(child.id)}
                                    >
                                      <EyeIcon className="size-4" />
                                    </Button>
                                  ) : child.status === "active" ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                                      aria-label="Edit"
                                      onClick={() => onEdit?.(child.id)}
                                    >
                                      <PencilIcon className="size-4" />
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                </Fragment>
              )
            })
          )}
        </TableBody>
      </Table>

      <div
        className={cn(
          "custom--pagination flex h-16 w-full items-center justify-end gap-4 rounded-lg bg-white px-4 py-2.5 shadow-[0_0_20px_0_#0000001a]",
          "my-8"
        )}
      >
        <span className="text-sm text-[#4B5563]">
          Total {pagination.totalItems} items
        </span>
        <Pagination className="w-auto mx-0 justify-end">
          <PaginationContent className="gap-2">
            <PaginationItem>
              <PaginationPrevious
                text=""
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (pagination.page > 1) onPageChange(pagination.page - 1)
                }}
                className={
                  pagination.page <= 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                href="#"
                isActive
                onClick={(e) => e.preventDefault()}
                className="cursor-default"
              >
                {pagination.page}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                text=""
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (pagination.page < totalPages)
                    onPageChange(pagination.page + 1)
                }}
                className={
                  pagination.page >= totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <Select
          value={String(pagination.pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-24 rounded-md border-[#D1D5DB] bg-white text-sm text-[#4B5563]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
