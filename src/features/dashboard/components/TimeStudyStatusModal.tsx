import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { X, Eye, Bell, CheckCircle, Clock, AlertCircle, Search, ArrowLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import { useDashboardStatusUsers, useDashboardTimeStudyRecords } from "../queries/dashboardQueries"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useActionUserTimeRecord } from "@/features/PersonalTimeStudy/TimeStudyMGT/mutations/updateActionUserTimeRecord"
import { toIsoYmdFromDate } from "@/lib/dates"



export type ModalVariant = "approved" | "pending" | "notSubmitted"

export interface TimeStudyStatusUser {
  id: string | number
  name: string
  department: string
  date?: string
}

export interface TimeStudyStatusModalProps {
  open: boolean
  onClose: () => void
  variant: ModalVariant
  month?: string
  year?: string
  quarter?: string
  userId?: string | number
}


const variantConfig: Record<
  ModalVariant,
  {
    title: string
    badgeColor: string
    badgeText: string
    headerBg: string
    accentColor: string
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  }
> = {
  approved: {
    title: "Approved Records",
    badgeColor: "bg-[#22c55e]/15 text-[#16a34a]",
    badgeText: "Approved",
    headerBg: "bg-gradient-to-r from-[#6C5DD3] to-[#8b7cf8]",
    accentColor: "#6C5DD3",
    icon: CheckCircle,
  },
  pending: {
    title: "Pending Approval Records",
    badgeColor: "bg-[#f59e0b]/15 text-[#d97706]",
    badgeText: "Pending Approval",
    headerBg: "bg-gradient-to-r from-[#d97706] to-[#f59e0b]",
    accentColor: "#d97706",
    icon: Clock,
  },
  notSubmitted: {
    title: "Not Submitted Records",
    badgeColor: "bg-[#ef4444]/15 text-[#dc2626]",
    badgeText: "Not Submitted",
    headerBg: "bg-gradient-to-r from-[#dc2626] to-[#f87171]",
    accentColor: "#dc2626",
    icon: AlertCircle,
  },
}



export function TimeStudyStatusModal({
  open,
  onClose,
  variant,
  month,
  year,
  quarter,
  userId,
}: TimeStudyStatusModalProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<TimeStudyStatusUser | null>(null)
  const [detailPage, setDetailPage] = useState(1)
  const [detailPageSize, setDetailPageSize] = useState(10)

  const { mutate: notifyUser } = useActionUserTimeRecord()
  const navigate = useNavigate()

  const statusMap: Record<ModalVariant, "approved" | "submitted" | "draft"> = {
    approved: "approved",
    pending: "submitted",
    notSubmitted: "draft",
  }
  const status = statusMap[variant]

  const { data: detailData, isLoading: isDetailLoading } = useDashboardTimeStudyRecords({
    userId: selectedUser?.id ?? "",
    status,
    page: detailPage,
    limit: detailPageSize,
    enabled: open && !!selectedUser,
  })

  const detailRows = detailData?.data ?? []
  const detailTotalItems = detailData?.meta?.totalItems ?? 0

  const { data, isLoading } = useDashboardStatusUsers({
    status,
    userId,
    month: month === "all" ? undefined : month,
    year: year === "all" ? undefined : year,
    quarter: quarter === "all" ? undefined : quarter,
    page,
    limit: pageSize,
    search: searchQuery ? searchQuery.trim() : undefined,
    enabled: open && !selectedUser,
  })

  const config = variantConfig[variant]
  const rows = data?.data ?? []
  const totalItems = data?.meta?.totalItems ?? 0
  const isNotSubmitted = variant === "notSubmitted"
  const showDate = false

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setPage(1)
  }

  const handleClose = () => {
    setPage(1)
    setSearchQuery("")
    setSelectedUser(null)
    setDetailPage(1)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        showClose={false}
        className={`w-full ${selectedUser ? "max-w-[1200px]" : "max-w-[650px]"} rounded-2xl border-0 p-0 gap-0 shadow-[0_24px_80px_0_rgba(108,93,211,0.18)] overflow-hidden transition-all duration-300`}
        overlayClassName="bg-black/40 backdrop-blur-[2px]"
      >
        {/* ── Header ── */}
        <DialogHeader className={`px-6 pt-5 ${selectedUser ? "pb-1.5" : "pb-4"}`}>
          <div className="flex items-center justify-between gap-4">
            {/* Left side: Icon & Title/Badge */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: `${config.accentColor}18` }}
              >
                <config.icon
                  className="h-[18px] w-[18px]"
                  style={{ color: config.accentColor }}
                />
              </div>
              <div>
                <DialogTitle className="text-[15px] font-semibold text-[#1a1a2e]">
                  {selectedUser ? selectedUser.name : config.title}
                </DialogTitle>
                <span
                  className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.badgeColor}`}
                >
                  {config.badgeText}
                </span>
              </div>
            </div>

            {/* Middle: Compact Search bar (only when reportee list view) */}
            {!selectedUser ? (
              <div className="relative flex-1 max-w-[220px] mx-2">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-8 w-full rounded-lg border border-[#e5e7eb] bg-white pl-8 pr-7 text-[12px] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#6C5DD3] focus:outline-none focus:ring-1 focus:ring-[#6C5DD3]/20 transition-all shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Right side: Back button (if selectedUser) & Close button */}
            <div className="flex items-center gap-2 shrink-0">
              {selectedUser && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null)
                    setDetailPage(1)
                  }}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[11px] font-bold transition-all hover:opacity-80 active:scale-95 shadow-sm"
                  style={{ 
                    borderColor: `${config.accentColor}25`, 
                    backgroundColor: `${config.accentColor}06`,
                    color: config.accentColor
                  }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" style={{ strokeWidth: 2.5 }} />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ca3af] transition-colors hover:bg-[#f3f4f6] hover:text-[#374151] shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {selectedUser ? (
          /* ── Time Entries Detailed UI ── */
          <div className="mx-6 mb-6">
            {/* Title row */}
            <div className="flex items-center justify-center mb-2.5">
              <h3 className="text-[14px] font-bold text-[#6C5DD3] text-center">Time Study Records</h3>
            </div>

            {/* Time Entries Table */}
            <div className="border border-[#e5e7eb] rounded-xl bg-white shadow-sm overflow-y-auto max-h-[380px]">
              <Table className="w-full table-fixed">
                <TableHeader className={`${config.headerBg} border-b-0 sticky top-0 z-10`}>
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="h-10 px-4 text-left font-bold text-[11px] uppercase tracking-wider text-white w-[15%]">
                      TS Program
                    </TableHead>
                    <TableHead className="h-10 px-4 text-left font-bold text-[11px] uppercase tracking-wider text-white w-[18%]">
                      Service / Activity Code
                    </TableHead>
                    <TableHead className="h-10 px-4 text-center font-bold text-[11px] uppercase tracking-wider text-white w-[11%]">
                      Date
                    </TableHead>
                    <TableHead className="h-10 px-4 text-center font-bold text-[11px] uppercase tracking-wider text-white w-[10%]">
                      Start
                    </TableHead>
                    <TableHead className="h-10 px-4 text-center font-bold text-[11px] uppercase tracking-wider text-white w-[10%]">
                      End
                    </TableHead>
                    <TableHead className="h-10 px-4 text-center font-bold text-[11px] uppercase tracking-wider text-white w-[7%]">
                      Min.
                    </TableHead>
                    <TableHead className="h-10 px-4 text-left font-bold text-[11px] uppercase tracking-wider text-white w-[17%]">
                      Notes
                    </TableHead>
                    <TableHead className="h-10 px-4 text-left font-bold text-[11px] uppercase tracking-wider text-white w-[12%]">
                      Supporting doc
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isDetailLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <Spinner className="mx-auto h-8 w-8 text-[#6C5DD3]" />
                      </TableCell>
                    </TableRow>
                  ) : detailRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-[#9ca3af]">
                        <AlertCircle className="mx-auto mb-2 h-8 w-8 opacity-30" />
                        <p className="text-sm font-medium">No records found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    detailRows.map((entry, index) => {
                      const programName = entry.programname || entry.programcode || "—";
                      const activityCode = entry.activitycode && entry.activityname
                        ? `${entry.activitycode} (${entry.activityname})`
                        : entry.activitycode || entry.activityname || "—";
                      const notesVal = entry.description || entry.comments || entry.notes || "—";
                      const dateVal = entry.date || "—";
                      const startVal = entry.starttime || "—";
                      const endVal = entry.endtime || "—";
                      const minVal = entry.activitytime ?? 0;
                      const docVal = entry.supportingDocs?.[0]?.fileName || "—";

                      return (
                        <TableRow
                          key={entry.id || index}
                          className={`border-b border-[#f0f0f5] last:border-0 bg-white hover:bg-[#f5f3ff]/30 transition-colors ${
                            index % 2 === 1 ? "bg-[#fafafa]/40" : "bg-white"
                          }`}
                        >
                          <TableCell className="px-4 py-2.5 text-[12px] font-medium text-[#374151] truncate" title={programName}>
                            {programName}
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-[12px] text-[#374151] truncate">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help block truncate">{activityCode}</span>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={6} className="z-[100] max-w-[300px] break-words">
                                  {activityCode}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-[12px] text-[#374151] text-center whitespace-nowrap">
                            {dateVal}
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-[12px] text-[#374151] text-center whitespace-nowrap">
                            {startVal}
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-[12px] text-[#374151] text-center whitespace-nowrap">
                            {endVal}
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-[12px] text-[#374151] text-center whitespace-nowrap">
                            {minVal}
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-[12px] text-[#6b7280] truncate" title={notesVal}>
                            {notesVal}
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-[12px] text-[#6b7280] truncate" title={docVal}>
                            {docVal}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ── Pagination Component ── */}
            <div className="mt-4">
              <MasterCodePagination
                totalItems={detailTotalItems}
                currentPage={detailPage}
                pageSize={detailPageSize}
                onPageChange={(p) => setDetailPage(p)}
                onPageSizeChange={(sz) => {
                  setDetailPageSize(sz)
                  setDetailPage(1)
                }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* ── Table Container ── */}
            <div className="mx-6 border border-[#e5e7eb] rounded-xl overflow-y-auto max-h-[450px] bg-white">
              <Table>
                <TableHeader className={`${config.headerBg} border-b-0 sticky top-0 z-10`}>
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className={`h-10 px-4 text-left font-bold text-[11px] uppercase tracking-wider text-white ${showDate ? "w-[35%]" : "w-[44%]"}`}>
                      User Name
                    </TableHead>
                    <TableHead className={`h-10 px-4 text-left font-bold text-[11px] uppercase tracking-wider text-white ${showDate ? "w-[35%]" : "w-[44%]"}`}>
                      Department
                    </TableHead>
                    {showDate && (
                      <TableHead className="h-10 px-4 text-center font-bold text-[11px] uppercase tracking-wider text-white w-[18%]">
                        Date
                      </TableHead>
                    )}
                    <TableHead className="h-10 px-4 text-center font-bold text-[11px] uppercase tracking-wider text-white w-[12%]">
                      View Records
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={showDate ? 4 : 3} className="text-center py-12">
                        <Spinner className="mx-auto h-8 w-8 text-[#6C5DD3]" />
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={showDate ? 4 : 3} className="text-center py-12 text-[#9ca3af]">
                        <AlertCircle className="mx-auto mb-2 h-8 w-8 opacity-30" />
                        <p className="text-sm font-medium">No records found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((user, idx) => (
                      <TableRow
                        key={user.id}
                        className={`border-b border-[#f0f0f5] last:border-0 hover:bg-[#f5f3ff]/50 transition-colors ${idx % 2 === 1 ? "bg-[#fafafa]/40" : "bg-white"
                          }`}
                      >
                        {/* User Name */}
                        <TableCell className="px-4 py-3 text-[13px] font-medium text-[#374151] whitespace-nowrap">
                          {user.name}
                        </TableCell>
 
                        {/* Department */}
                        <TableCell className="px-4 py-3 text-[13px] text-[#6b7280] whitespace-nowrap">
                          {user.department}
                        </TableCell>
 
                        {/* Date */}
                        {showDate && (
                          <TableCell className="px-4 py-3 text-[13px] text-[#374151] text-center whitespace-nowrap">
                            {user.date || "—"}
                          </TableCell>
                        )}

                        {/* Action */}
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              title="View"
                              onClick={() => {
                                if (variant === "pending") {
                                  navigate("/personal-time-study", {
                                    state: { 
                                      tab: "mgt", 
                                      userId: String(user.id),
                                      date: user.date
                                    }
                                  })
                                  handleClose()
                                } else {
                                  setSelectedUser(user)
                                }
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6C5DD3] transition-all hover:border-[#6C5DD3] hover:bg-[#6C5DD3] hover:text-white active:scale-95 shadow-sm"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {isNotSubmitted && (
                              <button
                                type="button"
                                title="Send Notification"
                                onClick={() => {
                                  if (!user.date) return
                                  const dateObj = new Date(user.date)
                                  const day = dateObj.getDay()
                                  const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1)
                                  const start = new Date(dateObj.setDate(diff))
                                  const end = new Date(start)
                                  end.setDate(start.getDate() + 6)

                                  notifyUser({
                                    userId: String(user.id),
                                    startDate: toIsoYmdFromDate(start),
                                    endDate: toIsoYmdFromDate(end),
                                    status: "notify",
                                  })
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#d97706] transition-all hover:border-[#d97706] hover:bg-[#d97706] hover:text-white active:scale-95 shadow-sm"
                              >
                                <Bell className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ── Pagination Component ── */}
            <div className="px-6 pb-6 pt-0 -mt-2.5">
              <MasterCodePagination
                totalItems={totalItems}
                currentPage={page}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(sz) => {
                  setPageSize(sz)
                  setPage(1)
                }}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
