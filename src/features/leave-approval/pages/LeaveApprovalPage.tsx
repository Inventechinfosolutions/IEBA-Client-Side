import { useMemo, useState } from "react"

import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import { LeaveApprovalTable } from "../components/LeaveApprovalTable"
import { LeaveApprovalCommentsModal } from "../components/LeaveApprovalCommentsModal"
import { LeaveApprovalToolbar } from "../components/LeaveApprovalToolbar"
import { useLeaveApprovalModule } from "../hooks/useLeaveApprovalModule"
import { useUpdateLeaveApproval } from "../mutations/updateLeaveApproval"
import { toast } from "sonner"
import { Check } from "lucide-react"
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<LeaveApprovalFilters>(defaultFilters)
  const [sort, setSort] = useState<LeaveApprovalSortState>(null)
  const [commentsModalOpen, setCommentsModalOpen] = useState(false)
  const [commentsModalRowId, setCommentsModalRowId] = useState<string | null>(null)
  const [commentsModalMode, setCommentsModalMode] = useState<"comments" | "reject" | "approve">("comments")

  const leaveModule = useLeaveApprovalModule({
    page,
    pageSize,
    filters,
    sort,
  })
  const updateMutation = useUpdateLeaveApproval({ page, pageSize, filters, sort })

  const isTableLoading = leaveModule.isLoading || leaveModule.isFetching

  const safeUserOptions = useMemo(
    () => leaveModule.userOptions ?? [{ id: "all", label: "All" }],
    [leaveModule.userOptions],
  )

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
        open={commentsModalOpen}
        onOpenChange={setCommentsModalOpen}
        initialValues={{
          commentText:
            leaveModule.rows.find((r) => r.id === commentsModalRowId)?.commentText ?? "",
        }}
        onSave={(values) => {
          const id = commentsModalRowId
          if (!id) return
          const trimmed = (values.commentText ?? "").trim()
          const currentStatus =
            leaveModule.rows.find((r) => r.id === id)?.status ?? "Approved"
          const nextStatus =
            commentsModalMode === "reject"
              ? "Rejected"
              : commentsModalMode === "approve"
                ? "Approved"
                : currentStatus

          updateMutation.mutate(
            {
              id,
              patch: {
                commentText: trimmed || undefined,
                commentsCount: trimmed ? 1 : 0,
                status: nextStatus,
              },
            },
            {
              onSuccess: () => {
                toast.success("Leave request submitted successfully", {
                  position: "top-center",
                  icon: (
                    <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
                      <Check className="size-3 stroke-[3]" />
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

