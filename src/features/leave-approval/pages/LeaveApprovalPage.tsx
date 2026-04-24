import { useMemo, useState } from "react"

import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import { LeaveApprovalTable } from "../components/LeaveApprovalTable"
import { LeaveApprovalCommentsModal } from "../components/LeaveApprovalCommentsModal"
import { LeaveApprovalToolbar } from "../components/LeaveApprovalToolbar"
import { useLeaveApprovals } from "../hooks/useLeaveApprovals"
import { useUpdateLeaveApproval } from "../mutations/updateLeaveApproval"
import { toast } from "sonner"
import { Check } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

import { usePermissions } from "@/hooks/usePermissions"
import type {
  LeaveApprovalFilters,
  LeaveApprovalSortKey,
  LeaveApprovalSortState,
  LeaveApprovalTypeFilter,
} from "../types"

const defaultFilters: LeaveApprovalFilters = {
  type: "All",
  userId: "all",
}

function nextSortState(prev: LeaveApprovalSortState, key: LeaveApprovalSortKey): LeaveApprovalSortState {
  if (!prev || prev.key !== key) return { key, direction: "asc" }
  if (prev.direction === "asc") return { key, direction: "desc" }
  return null
}

export function LeaveApprovalPage() {
  const { 
    isSuperAdmin, 
    canReview
  } = usePermissions()
  const { user } = useAuth()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<LeaveApprovalFilters>(defaultFilters)
  const [sort, setSort] = useState<LeaveApprovalSortState>(null)
  const [commentsModalOpen, setCommentsModalOpen] = useState(false)
  const [commentsModalRowId, setCommentsModalRowId] = useState<number | null>(null)
  const [commentsModalMode, setCommentsModalMode] = useState<"comments" | "reject" | "approve" | "requested">("comments")
  /** Bumps on each open so the comments form remounts with empty defaults (no useEffect). */
  const [commentsModalFormKey, setCommentsModalFormKey] = useState(0)

  const hasAccess = isSuperAdmin || canReview("userleave")

  const leaveModule = useLeaveApprovals({
    page,
    pageSize,
    filters,
    sort,
    enabled: hasAccess,
    supervisorUserId: isSuperAdmin ? undefined : user?.id,
  })

  if (!hasAccess) {
    return null
  }
  const updateMutation = useUpdateLeaveApproval({ page, pageSize, filters, sort })

  const isTableLoading = leaveModule.isLoading || leaveModule.isFetching

  const safeUserOptions = useMemo(() => leaveModule.userOptions ?? [], [leaveModule.userOptions])

  return (
    <section
      className="font-roboto *:font-roboto w-full"
      style={
        {
          zoom: 1.2,
          "--primary": "#6C5DD3",
        } as React.CSSProperties
      }
    >
      <div className="rounded-[8px] bg-white p-3">
        <div className="mb-5">
          <LeaveApprovalToolbar
            defaultValues={filters}
            userOptions={safeUserOptions}
            isSubmitting={isTableLoading}
            onSearch={(values) => {
              setPage(1)
              setFilters({
                type: values.type as LeaveApprovalTypeFilter,
                userId: values.userId || "all",
              })
            }}
          />
        </div>
        <LeaveApprovalTable
          rows={leaveModule.rows}
          isLoading={isTableLoading}
          sort={sort}
          onToggleSort={(key) => {
            setPage(1)
            setSort((prev) => nextSortState(prev, key))
          }}
          onOpenComments={(rowId, mode) => {
            setCommentsModalRowId(rowId)
            setCommentsModalMode(mode)
            setCommentsModalFormKey((k) => k + 1)
            setCommentsModalOpen(true)
          }}
        />
        <MasterCodePagination
          totalItems={leaveModule.totalItems}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={(p: number) => setPage(p)}
          onPageSizeChange={(next: number) => {
            setPage(1)
            setPageSize(next)
          }}
        />
      </div>

      <LeaveApprovalCommentsModal
        key={commentsModalFormKey}
        open={commentsModalOpen}
        onOpenChange={setCommentsModalOpen}
        mode={commentsModalMode}
        initialValues={{
          commentText: "",
        }}
        onSave={(values, action) => {
          const id = commentsModalRowId
          if (!id) return
          const trimmed = (values.commentText ?? "").trim()
          const resolvedAction =
            action === "approve" || action === "reject"
              ? action
              : commentsModalMode === "approve" || commentsModalMode === "reject"
                ? commentsModalMode
                : null

          if (!resolvedAction) {
            setCommentsModalOpen(false)
            return
          }

          updateMutation.mutate(
            {
              id,
              action: resolvedAction === "approve" ? "approved" : "rejected",
              supervisorcomment: trimmed || undefined,
            },
            {
              onSuccess: () => {
                toast.success("Leave request submitted successfully", {
                  position: "top-center",
                  icon: (
                    <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
                    <Check className="size-3 stroke-3" />
                    </span>
                  ),
                })
              },
            },
          )
          setCommentsModalOpen(false)
        }}
      />
    </section>
  )
}

