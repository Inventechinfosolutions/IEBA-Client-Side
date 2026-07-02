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
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import type { DepartmenRoleTableProps } from "../types"
import { cn } from "@/lib/utils"
import statusCheckImg from "@/assets/status-check.png"
import statusCrossImg from "@/assets/status-cross.png"
import { usePermissions } from "@/hooks/usePermissions"


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
  isSaving = false,
}: DepartmenRoleTableProps) {
  const { isSuperAdmin } = usePermissions()
  const canAddRole = isSuperAdmin
  const canUpdateRole = isSuperAdmin
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /** Server returns one page per request; `data` is already the current page. */
  const rows = data

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[10px] border-[0.5px] border-[rgb(218,218,218)] bg-[rgb(255,255,255)]">
      {isSaving && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60">
          <Spinner className="text-[#6C5DD3]" />
        </div>
      )}
      {/* Desktop view Table */}
      <div className="hidden xl:block">
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
              rows.map((row, index) => {
                const isExpanded = expandedIds.has(row.id)
                const hasChildren = row.children && row.children.length > 0
                return (
                  <Fragment key={row.id}>
                    <TableRow
                      key={row.id}
                      className={cn(
                        "border-[#f0f0f0]",
                        !(hasChildren && isExpanded) && "border-b",
                        index % 2 === 1 ? "bg-[#FAF8FF] hover:bg-[#FAF8FF]" : "bg-white hover:bg-white"
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
                            <img
                              src={statusCrossImg}
                              alt="Inactive"
                              className="h-[18px] w-[18px] shrink-0 object-contain"
                              aria-label="Inactive"
                            />
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
                              {canAddRole && (
                                <DropdownMenuItem
                                  onClick={() => onOptionAction?.(row.id, "add")}
                                  className="cursor-pointer text-black focus:text-black"
                                >
                                  <PlusIcon className="mr-2 size-4 text-[rgb(108,93,211)]" />
                                  Add
                                </DropdownMenuItem>
                              )}
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
                                      ) : child.status === "active" && canUpdateRole ? (
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
        </div>

      {/* Mobile/Tablet Cards View (hidden on xl and above) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:hidden p-4 bg-[#F9FAFB]">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[10px] border border-[#E5E7EB] bg-white p-5 space-y-4 animate-pulse">
              <Skeleton className="h-6 w-1/3 rounded bg-gray-200" />
              <Skeleton className="h-4 w-2/3 rounded bg-gray-200" />
              <Skeleton className="h-4 w-full rounded bg-gray-200" />
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-[#6B7280] bg-white rounded-[8px] border border-[#E5E7EB] w-full col-span-full">
            No department roles found.
          </div>
        ) : (
          rows.map((row) => {
            const isExpanded = expandedIds.has(row.id)
            const hasChildren = row.children && row.children.length > 0
            return (
              <div
                key={row.id}
                className="rounded-[10px] border border-[#E5E7EB] bg-white shadow-sm overflow-hidden text-[13px] text-[#111827] flex flex-col"
              >
                {/* Header: Department Name & Status */}
                <div className="flex items-center justify-between bg-[#6C5DD3] px-5 py-3 text-white">
                  <div className="flex items-center gap-2">
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(row.id)}
                        className="flex shrink-0 items-center justify-center rounded p-0.5 text-white hover:bg-white/10"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="size-4" />
                        ) : (
                          <ChevronRightIcon className="size-4" />
                        )}
                      </button>
                    )}
                    <span className="font-bold text-[14px] tracking-wide">{row.departmentName}</span>
                  </div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm ${row.status === "active" ? "bg-[#28A745] text-white" : "bg-[#DC3545] text-white"}`}>
                    {row.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4 flex-1">
                  {/* Roles list */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Roles</span>
                    <div className="flex flex-wrap gap-2">
                      {row.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-block rounded-[10px] border-[0.5px] border-solid border-[rgb(217,217,217)] bg-gray-50 px-2.5 py-1 text-[12px] text-gray-800 font-semibold"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Options Menu buttons stacked side-by-side at bottom */}
                  <div className="flex gap-3 border-t border-[#F0F0F0] pt-4">
                    {canAddRole && (
                      <button
                        type="button"
                        onClick={() => onOptionAction?.(row.id, "add")}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E7EB] text-[#6C5DD3] hover:bg-[#6C5DD3]/5 text-[12px] font-bold transition-all duration-150 active:scale-95 shadow-sm w-full"
                      >
                        <PlusIcon className="size-3.5" />
                        Add Role
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOptionAction?.(row.id, "delete")}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E7EB] text-red-600 hover:bg-red-50 text-[12px] font-bold transition-all duration-150 active:scale-95 shadow-sm w-full"
                    >
                      <Trash2Icon className="size-3.5" />
                      Delete
                    </button>
                  </div>

                  {/* Expanded children */}
                  {hasChildren && isExpanded && (
                    <div className="border-t border-[#E5E7EB] mt-4 pt-4 space-y-3">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Child Roles</span>
                      <div className="space-y-2">
                        {row.children?.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-[#E5E7EB] bg-gray-50/30"
                          >
                            <div className="flex items-center gap-2">
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
                              <span className="font-semibold text-gray-800">{child.roleName}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Status check */}
                              <img
                                src={child.status === "active" ? statusCheckImg : statusCrossImg}
                                alt={child.status === "active" ? "Active" : "Inactive"}
                                className="h-[18px] w-[18px] shrink-0 object-contain"
                              />

                              {/* Edit or view action button */}
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
                              ) : child.status === "active" && canUpdateRole ? (
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
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <MasterCodePagination
        totalItems={pagination.totalItems}
        currentPage={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
