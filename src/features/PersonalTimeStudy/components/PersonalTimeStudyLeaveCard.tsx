import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"

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
import { apiGetUserLeaveById, apiGetUserProgramsAndActivities } from "../api/personalTimeStudyApi"
import { personalTimeStudyKeys } from "../keys"
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
  /** From user profile — enables multicode program/activity flow in leave dialog. */
  allowMultiCodes?: boolean
  onOpen?: () => void
  onDropdownOpen?: () => void
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
  allowMultiCodes,
  dateStr = "",
  month = 1,
  year = (() => { const _n = new Date(); return _n.getFullYear() })(),
  isLoading = false,
}: PersonalTimeStudyLeaveCardProps) {
  const [searchParams] = useSearchParams()
  const highlight = searchParams.get("focus") === "leave"
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

  const [leaveDropdownOpened, setLeaveDropdownOpened] = useState(false)
  const leaveDropdownQuery = useQuery({
    queryKey: [...personalTimeStudyKeys.dropdowns(userId), "leave-modal"],
    queryFn: () => apiGetUserProgramsAndActivities(userId),
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

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
    const parentRow = {
      id: editingLeave.id,
      date: (editingLeave as any).startdt ?? "",
      startTime: ((editingLeave as any).starttime || "").slice(0, 5),
      endTime: ((editingLeave as any).endtime || "").slice(0, 5),
      programCode: String((editingLeave as any).programid ?? ""),
      activityCode: String((editingLeave as any).activityid ?? ""),
      totalMinApplied: String((editingLeave as any).leaveTotalTime ?? "0"),
      comment: (editingLeave as any).requestcomment || "",
      multicodeChild: false,
    }

    const childRows = ((editingLeave as any).multiCodeRecords ?? []).map((c: any) => ({
      id: c.id,
      date: (editingLeave as any).startdt ?? "",
      startTime: ((editingLeave as any).starttime || "").slice(0, 5),
      endTime: ((editingLeave as any).endtime || "").slice(0, 5),
      programCode: String(c.programid ?? ""),
      activityCode: String(c.activityid ?? ""),
      totalMinApplied: String(c.leaveTotalTime ?? "0"),
      comment: c.requestcomment || "",
      multicodeChild: true,
    }))

    return {
      entries: [parentRow, ...childRows]
    }
  }, [editingLeave])

  return (
    <>
      <style>{`
        @keyframes purple-blink {
          0%, 100% {
            transform: scale(1);
            border-color: transparent;
            box-shadow: 0 4px 16px rgba(16, 24, 40, 0.12);
          }
          50% {
            transform: scale(1.05);
            border-color: #6C5DD3;
            box-shadow: 0 0 20px rgba(108, 93, 211, 0.65);
          }
        }
        .animate-leave-blink {
          animation: purple-blink 1s ease-in-out 5;
        }
      `}</style>
      <Card
        className={cn(
          "flex flex-col gap-0 rounded-[10px] border border-transparent bg-white py-0 shadow-[0_4px_16px_rgba(16,24,40,0.12)] ring-0 transition-all duration-500",
          highlight && "animate-leave-blink",
          className,
        )}
        size="sm"
      >
        <CardHeader className="shrink-0 px-3 pb-1 pt-3">
          <CardTitle className="text-center text-[13px] font-semibold text-[#6C5DD3]">
            Leave Status ({leaveCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-3 pb-3 pt-0">
          <ul className="flex flex-col text-[12px] divide-y divide-[#E5E7EB]">
            <li
              className="flex cursor-pointer items-center justify-between gap-2 rounded-[4px] px-1 py-1.5 transition-colors hover:bg-gray-50"
              onClick={() => handleStatusClick("approved")}
            >
              <span className="flex items-center gap-1.5 text-foreground">
                <CheckCircle2 className="size-4 text-green-600" aria-hidden />
                Approved
              </span>
              <span className="tabular-nums text-muted-foreground font-medium">{approved}</span>
            </li>
            <li
              className="flex cursor-pointer items-center justify-between gap-2 rounded-[4px] px-1 py-1.5 transition-colors hover:bg-gray-50"
              onClick={() => handleStatusClick("open")}
            >
              <span className="flex items-center gap-1.5 text-foreground">
                <AlertCircle className="size-4 text-amber-500" aria-hidden />
                Open
              </span>
              <span className="tabular-nums text-muted-foreground font-medium">{open}</span>
            </li>
            <li
              className="flex cursor-pointer items-center justify-between gap-2 rounded-[4px] px-1 py-1.5 transition-colors hover:bg-gray-50"
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
            className="h-8 w-full rounded-[8px] bg-[#6C5DD3] text-[12px] hover:bg-[#6C5DD3]/90"
            onClick={() => {
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
          dropdownData={leaveDropdownQuery.data}
          userId={userId}
          allowMultiCodes={allowMultiCodes}
          onDropdownOpen={() => {
            if (!leaveDropdownOpened) {
              setLeaveDropdownOpened(true)
            } else {
              leaveDropdownQuery.refetch()
            }
          }}
          editingLeave={editingLeave}
          onSave={async (values, lookupDropdown) => {
            if (editingLeave) {
              await updateMutation.mutateAsync({ id: (editingLeave as any).id, values, userId, dropdownData: lookupDropdown ?? leaveDropdownQuery.data, status: "draft" })
            } else {
              await saveMutation.mutateAsync({ values, userId, dropdownData: lookupDropdown ?? leaveDropdownQuery.data })
            }
          }}
          onSubmit={async (values, lookupDropdown) => {
            if (editingLeave) {
              const targetStatus = editingStatus?.toLowerCase() === "approved" ? "approved" : "requested"
              await updateMutation.mutateAsync({ id: (editingLeave as any).id, values, userId, dropdownData: lookupDropdown ?? leaveDropdownQuery.data, status: targetStatus })
            } else {
              await submitMutation.mutateAsync({ values, userId, dropdownData: lookupDropdown ?? leaveDropdownQuery.data })
            }
          }}
          isSaving={saveMutation.isPending || (updateMutation.isPending && (editingStatus?.toLowerCase() !== "approved" && editingStatus?.toLowerCase() !== "requested"))}
          isSubmitting={submitMutation.isPending || (updateMutation.isPending && (editingStatus?.toLowerCase() === "approved" || editingStatus?.toLowerCase() === "requested"))}
          isDropdownLoading={leaveDropdownQuery.isFetching}
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
    </>
  )
}
