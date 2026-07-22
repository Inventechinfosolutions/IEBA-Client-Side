import React, { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  EyeIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  Building2,
  Shield,
} from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import statusCheckImg from "@/assets/status-check.png"
import statusCrossImg from "@/assets/status-cross.png"

import type { DepartmentRoleWithChildren, DepartmentRoleChildRow } from "../types"

export interface DepartmentRoleCardViewProps {
  data: DepartmentRoleWithChildren[]
  isLoading: boolean
  isSaving?: boolean
  canAddRole?: boolean
  canUpdateRole?: boolean
  onView?: (id: string) => void
  onEdit?: (childId: string) => void
  onToggleChildStatus?: (childId: string, active: boolean) => void
  onOptionAction?: (id: string, action: string) => void
  footer?: React.ReactNode
}

function StatusIcon({ value }: { value: boolean }) {
  return (
    <img
      src={value ? statusCheckImg : statusCrossImg}
      alt={value ? "Active" : "Inactive"}
      className="h-4 w-4 object-contain"
    />
  )
}

export function DepartmentRoleCardView({
  data,
  isLoading,
  isSaving = false,
  canAddRole = true,
  canUpdateRole = true,
  onView,
  onEdit,
  onToggleChildStatus,
  onOptionAction,
  footer,
}: DepartmentRoleCardViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="block xl:hidden space-y-4 w-full min-w-0 relative">
      {isSaving && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-black/60 rounded-[12px]">
          <Spinner className="text-[#6C5DD3]" />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`dept-role-skeleton-${idx}`}
              className="rounded-[12px] border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0d12] overflow-hidden animate-pulse"
            >
              <div className="h-12 bg-[#6C5DD3] px-5 py-3 flex justify-between items-center">
                <div className="h-4 w-1/3 rounded bg-white/40" />
                <div className="h-5 w-16 rounded bg-white/40" />
              </div>
              <div className="p-5 space-y-3">
                <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-zinc-800" />
                <div className="flex gap-2">
                  <div className="h-7 w-24 rounded bg-gray-200 dark:bg-zinc-800" />
                  <div className="h-7 w-20 rounded bg-gray-200 dark:bg-zinc-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-[12px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[160px] w-full">
          <img
            src={tableEmptyIcon}
            alt="No data"
            aria-hidden="true"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[14px] font-medium text-gray-500 dark:text-zinc-400">
            No department roles found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {data.map((row) => {
            const isExpanded = expandedIds.has(row.id)
            const hasChildren = Boolean(row.children && row.children.length > 0)
            const isActive = row.status === "active"

            return (
              <div
                key={`dept-role-card-${row.id}`}
                className="rounded-[12px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] shadow-sm hover:shadow-md transition-all overflow-hidden w-full min-w-0"
              >
                {/* Header */}
                <div className="bg-[#6C5DD3] px-4 py-3 text-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="size-4 shrink-0 text-white/80" />
                    <span className="font-bold text-[14px] truncate text-white">
                      {row.departmentName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status Icon */}
                    <StatusIcon value={isActive} />

                    {/* Expand Toggle */}
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(row.id)}
                        className="p-1 hover:bg-white/20 rounded-[6px] transition-colors text-white cursor-pointer"
                        title={isExpanded ? "Collapse roles" : "Expand roles"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="size-5" />
                        ) : (
                          <ChevronDown className="size-5" />
                        )}
                      </button>
                    )}

                    {/* Options Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="p-1 hover:bg-white/20 rounded-[6px] transition-colors text-white cursor-pointer"
                          aria-label="More options"
                        >
                          <MoreVerticalIcon className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="min-w-[120px] bg-white dark:bg-[#18181b] border border-[#e5e5e5] dark:border-[rgba(108,93,211,0.4)]"
                      >
                        {canAddRole && (
                          <DropdownMenuItem
                            onClick={() => onOptionAction?.(row.id, "add")}
                            className="cursor-pointer text-black dark:text-[#e4e4e7] focus:bg-[#EBF5FF] dark:focus:bg-[#2a1f52] focus:text-black dark:focus:text-[#e4e4e7]"
                          >
                            <PlusIcon className="mr-2 size-4 text-[#6C5DD3]" />
                            Add
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onOptionAction?.(row.id, "delete")}
                          className="cursor-pointer text-black dark:text-[#e4e4e7] focus:bg-[#EBF5FF] dark:focus:bg-[#2a1f52] focus:text-black dark:focus:text-[#e4e4e7]"
                        >
                          <Trash2Icon className="mr-2 size-4 text-[#6C5DD3]" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5] flex items-center gap-1.5">
                      <Shield className="size-3 text-[#6C5DD3]" />
                      Roles ({row.roles.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {row.roles.map((role) => (
                        <span
                          key={role}
                          className="rounded-[8px] border border-[#E5E7EB] dark:border-[#27272a] bg-[#F9FAFB] dark:bg-[#18181b] px-2.5 py-1 text-[12px] font-medium text-[#374151] dark:text-[#e4e4e7]"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sub-Roles Expanded View */}
                {hasChildren && isExpanded && (
                  <div className="bg-[#F6F5FF] dark:bg-[#13141a] border-t border-[#E5E7EB] dark:border-[#27272a] p-3 space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6C5DD3] dark:text-[#a78bfa] px-1">
                      Roles ({row.children?.length ?? 0})
                    </div>
                    {row.children?.map((child: DepartmentRoleChildRow) => {
                      const isChildActive = child.status === "active"

                      return (
                        <div
                          key={`child-role-${child.id}`}
                          className="rounded-[10px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-3 flex items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Checkbox
                              checked={isChildActive}
                              disabled={child.autoselected}
                              onCheckedChange={(checked) => {
                                if (child.autoselected) return
                                onToggleChildStatus?.(child.id, checked === true)
                              }}
                              className="border-[#6C5DD3] data-[state=checked]:border-[#6C5DD3] data-[state=checked]:bg-[#6C5DD3]"
                            />
                            <span className="font-semibold text-[13px] text-[#111827] dark:text-white truncate">
                              {child.roleName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <StatusIcon value={isChildActive} />

                            {child.autoselected ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                                aria-label="View role details"
                                onClick={() => onView?.(child.id)}
                              >
                                <EyeIcon className="size-3.5" />
                              </Button>
                            ) : isChildActive && canUpdateRole ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                                aria-label="Edit role"
                                onClick={() => onEdit?.(child.id)}
                              >
                                <PencilIcon className="size-3.5" />
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {footer ? <div className="pt-2">{footer}</div> : null}
    </div>
  )
}
