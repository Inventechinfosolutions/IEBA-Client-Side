import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { useState, useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

import { EmployeeLeaveRequestDialog } from "./EmployeeLeaveRequestDialog"
import { PendingLeaveRequestDialog } from "./PendingLeaveRequestDialog"
import { 
  useCreatePersonalLeave, 
  useSubmitPersonalLeave, 
  useUpdatePersonalLeave, 
  useWithdrawPersonalLeave 
} from "../mutation/createPersonalLeave"
import { apiGetUserLeaveById } from "../api/personalTimeStudyApi"
import type { UserLeaveDaySnapshotResDto } from "../types"
import type { EmployeeLeaveRequestFormValues } from "../schema/PersonalTimeStudySchema"

type PersonalTimeStudyLeaveCardProps = {
  leaveCount: number
  approved: number
  open: number
  rejected: number
  leaveRecords?: import("../types").UserLeaveDaySnapshotResDto[]
  className?: string
  dropdownData?: any[]
  onOpen?: () => void
  dateStr?: string
  month?: number
  year?: number
  isLoading?: boolean
  isDropdownLoading?: boolean
}

export function PersonalTimeStudyLeaveCard({
  leaveCount,
  approved,
  open,
  rejected,
  leaveRecords = [],
  className,
  dropdownData,
  onOpen,
  dateStr = "",
  month = 1,
  year = (() => { const _n = new Date(); return _n.getFullYear() })(),
  isLoading = false,
  isDropdownLoading = false,
}: PersonalTimeStudyLeaveCardProps) {
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const { user } = useAuth()
  const userId = user?.id ?? ""

  const saveMutation = useCreatePersonalLeave(userId, dateStr, month, year)
  const submitMutation = useSubmitPersonalLeave(userId, dateStr, month, year)
  const updateMutation = useUpdatePersonalLeave(userId, dateStr, month, year)
  const withdrawMutation = useWithdrawPersonalLeave(userId, dateStr, month, year)

  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<"approved" | "open" | "rejected" | null>(null)
  const [editingLeave, setEditingLeave] = useState<UserLeaveDaySnapshotResDto | null>(null)
  const [isFetchingDetail, setIsFetchingDetail] = useState(false)

  const { filteredLeaves, listTitle } = useMemo(() => {
    if (!selectedStatus) return { filteredLeaves: [], listTitle: "" }

    if (selectedStatus === "approved") {
      return {
        filteredLeaves: leaveRecords.filter(r => r.status?.toLowerCase() === "approved"),
        listTitle: "Approved Leave Request"
      }
    }
    if (selectedStatus === "open") {
      return {
        filteredLeaves: leaveRecords.filter(r => ["draft", "requested"].includes(r.status?.toLowerCase() ?? "")),
        listTitle: "Pending Leave Request"
      }
    }
    if (selectedStatus === "rejected") {
      return {
        filteredLeaves: leaveRecords.filter(r => r.status?.toLowerCase() === "rejected"),
        listTitle: "Rejected Leave Request"
      }
    }
    return { filteredLeaves: [], listTitle: "" }
  }, [selectedStatus, leaveRecords])

  const handleStatusClick = (statusType: "approved" | "open" | "rejected") => {
    setSelectedStatus(statusType)
    setListDialogOpen(true)
  }

  const handleEdit = async (leave: UserLeaveDaySnapshotResDto) => {
    setEditingLeave(leave)
    setListDialogOpen(false)
    setLeaveDialogOpen(true)
    setIsFetchingDetail(true)
    try {
      const fullLeave = await apiGetUserLeaveById(leave.id)
      setEditingLeave(fullLeave)
    } catch (e) {
      console.error("Failed to fetch leave details", e)
    } finally {
      setIsFetchingDetail(false)
    }
  }

  const handleWithdraw = async (leave: UserLeaveDaySnapshotResDto) => {
    await withdrawMutation.mutateAsync(leave)
    setListDialogOpen(false)
  }

  // editingLeave can be the full UserLeave entity (from API) or a snapshot — handle both
  const editingStatus = (editingLeave as any)?.status ?? null

  const initialValues: EmployeeLeaveRequestFormValues | undefined = useMemo(() => {
    if (!editingLeave) return undefined
    return {
      entries: [{
        date: (editingLeave as any).startdt ?? "",
        startTime: ((editingLeave as any).starttime || "").slice(0, 5),
        endTime: ((editingLeave as any).endtime || "").slice(0, 5),
        programCode: String((editingLeave as any).programid ?? ""),
        activityCode: String((editingLeave as any).activityid ?? ""),
        totalMinApplied: String((editingLeave as any).leaveTotalTime ?? "0"),
        comment: (editingLeave as any).requestcomment || "",
      }]
    }
  }, [editingLeave])

  return (
    <Card
      className={cn("flex h-full min-h-0 flex-col gap-0 border-0 ring-0 py-0 bg-white shadow-[0_4px_16px_rgba(16,24,40,0.12)] rounded-[6px]", className)}
      size="sm"
    >
      <CardHeader className="shrink-0 px-3 pt-2 pb-1">
        <CardTitle className="text-[14px] font-semibold text-foreground">
          Leave Status ({leaveCount})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 px-3 pt-2 pb-3">
        <ul className="flex flex-col text-[14px] divide-y divide-border/60">
          <li 
            className="flex items-center justify-between gap-2 py-1.5 cursor-pointer hover:bg-gray-50 transition-colors px-1 rounded-[4px]"
            onClick={() => handleStatusClick("approved")}
          >
            <span className="flex items-center gap-1.5 text-foreground">
              <CheckCircle2 className="size-4 text-green-600" aria-hidden />
              Approved
            </span>
            <span className="tabular-nums text-muted-foreground font-medium">{approved}</span>
          </li>
          <li 
            className="flex items-center justify-between gap-2 py-1.5 cursor-pointer hover:bg-gray-50 transition-colors px-1 rounded-[4px]"
            onClick={() => handleStatusClick("open")}
          >
            <span className="flex items-center gap-1.5 text-foreground">
              <AlertCircle className="size-4 text-amber-500" aria-hidden />
              Open
            </span>
            <span className="tabular-nums text-muted-foreground font-medium">{open}</span>
          </li>
          <li 
            className="flex items-center justify-between gap-2 py-1.5 cursor-pointer hover:bg-gray-50 transition-colors px-1 rounded-[4px]"
            onClick={() => handleStatusClick("rejected")}
          >
            <span className="flex items-center gap-1.5 text-foreground">
              <XCircle className="size-4 text-red-500" aria-hidden />
              Rejected
            </span>
            <span className="tabular-nums text-muted-foreground font-medium">{rejected}</span>
          </li>
        </ul>
        <Button
          type="button"
          className="mt-auto w-full bg-[#6C5DD3] hover:bg-[#6C5DD3]/90 rounded-[6px]"
          onClick={() => {
            onOpen?.()
            setLeaveDialogOpen(true)
          }}
        >
          Leave Request
        </Button>
      </CardContent>

      <EmployeeLeaveRequestDialog
        key={(editingLeave as any)?.id ?? "new"}
        open={leaveDialogOpen}
        onOpenChange={(open) => {
          setLeaveDialogOpen(open)
          if (!open) setEditingLeave(null)
        }}
        title={editingLeave ? (editingStatus?.toLowerCase() === "approved" ? "Edit Approved Leave Request" : "Edit Employee Leave Request") : "Employee Leave Request"}
        initialValues={initialValues}
        editingStatus={editingStatus}
        dropdownData={dropdownData}
        editingLeave={editingLeave}
        onSave={async (values) => { 
          if (editingLeave) {
            await updateMutation.mutateAsync({ id: (editingLeave as any).id, values, userId, dropdownData, status: "draft" })
          } else {
            await saveMutation.mutateAsync({ values, userId, dropdownData }) 
          }
        }}
        onSubmit={async (values) => { 
          if (editingLeave) {
            const targetStatus = editingStatus?.toLowerCase() === "approved" ? "approved" : "requested"
            await updateMutation.mutateAsync({ id: (editingLeave as any).id, values, userId, dropdownData, status: targetStatus })
          } else {
            await submitMutation.mutateAsync({ values, userId, dropdownData }) 
          }
        }}
        isSaving={saveMutation.isPending || (updateMutation.isPending && (editingStatus?.toLowerCase() !== "approved" && editingStatus?.toLowerCase() !== "requested"))}
        isSubmitting={submitMutation.isPending || (updateMutation.isPending && (editingStatus?.toLowerCase() === "approved" || editingStatus?.toLowerCase() === "requested"))}
        isDropdownLoading={isDropdownLoading}
        isFetching={isFetchingDetail}
      />

      <PendingLeaveRequestDialog
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        title={listTitle}
        leaves={filteredLeaves}
        onEdit={handleEdit}
        onCancel={handleWithdraw}
        dropdownData={dropdownData}
        isLoading={isLoading || withdrawMutation.isPending}
      />
    </Card>
  )
}
