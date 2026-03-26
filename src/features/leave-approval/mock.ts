import type {
  GetLeaveApprovalsParams,
  LeaveApprovalListResponse,
  LeaveApprovalRow,
  LeaveApprovalStatus,
  LeaveApprovalUserOption,
} from "./types"

const toUserId = (label: string) => label.toLowerCase().trim().replace(/\s+/g, "-")

export const mockSeedRows: LeaveApprovalRow[] = [
  { id: "1", employeeName: "Bennett Leyla", startDate: "03-01-2026", startTime: "08:00:00", endTime: "09:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-12 Paid Time Off", totalMinutes: 375, status: "Approved", commentsCount: 0 },
  { id: "2", employeeName: "CAVILLO-HEFNER KRISTEN", startDate: "04-04-2026", startTime: "09:00:00", endTime: "10:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-08 SPMP Program Planning and Policy Development for Long Tooltip Display Example", totalMinutes: 20, status: "Rejected", commentsCount: 1, commentText: "Please provide description." },
  { id: "3", employeeName: "Hanion Teal", startDate: "05-07-2026", startTime: "10:00:00", endTime: "11:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-12 Paid Time Off", totalMinutes: 385, status: "Withdraw", commentsCount: 0 },
  { id: "4", employeeName: "MacKay Jessica", startDate: "03-10-2026", startTime: "11:00:00", endTime: "12:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-08 SPMP Program Planning and Policy Development for Long Tooltip Display Example", totalMinutes: 30, status: "Approved", commentsCount: 0 },
  { id: "5", employeeName: "Osguera Lenis", startDate: "04-13-2026", startTime: "12:00:00", endTime: "13:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-12 Paid Time Off", totalMinutes: 375, status: "Rejected", commentsCount: 2, commentText: "Payroll needs clarification for entry #5." },
  { id: "6", employeeName: "Prater Jordan", startDate: "05-16-2026", startTime: "13:00:00", endTime: "14:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-08 SPMP Program Planning and Policy Development for Long Tooltip Display Example", totalMinutes: 20, status: "Withdraw", commentsCount: 0 },
  { id: "7", employeeName: "RAKESTRAW MELISSA", startDate: "03-19-2026", startTime: "14:00:00", endTime: "15:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-12 Paid Time Off", totalMinutes: 385, status: "Approved", commentsCount: 0 },
  { id: "8", employeeName: "Rugger Natalie", startDate: "04-22-2026", startTime: "15:00:00", endTime: "16:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-08 SPMP Program Planning and Policy Development for Long Tooltip Display Example", totalMinutes: 30, status: "Rejected", commentsCount: 1, commentText: "Please provide description." },
  { id: "9", employeeName: "Smith Shonda", startDate: "05-25-2026", startTime: "16:00:00", endTime: "17:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-12 Paid Time Off", totalMinutes: 375, status: "Withdraw", commentsCount: 0 },
  { id: "10", employeeName: "Taylor Sarah", startDate: "03-28-2026", startTime: "17:00:00", endTime: "18:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-08 SPMP Program Planning and Policy Development for Long Tooltip Display Example", totalMinutes: 20, status: "Approved", commentsCount: 0 },
  { id: "11", employeeName: "Andrews Lia", startDate: "04-02-2026", startTime: "07:00:00", endTime: "08:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-12 Paid Time Off", totalMinutes: 385, status: "Rejected", commentsCount: 2, commentText: "Payroll needs clarification for entry #11." },
  { id: "12", employeeName: "James Peter", startDate: "05-05-2026", startTime: "06:00:00", endTime: "07:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-08 SPMP Program Planning and Policy Development for Long Tooltip Display Example", totalMinutes: 30, status: "Withdraw", commentsCount: 0 },
  { id: "13", employeeName: "Arman Jude", startDate: "03-08-2026", startTime: "05:00:00", endTime: "06:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-12 Paid Time Off", totalMinutes: 375, status: "Approved", commentsCount: 0 },
  { id: "14", employeeName: "Stewart Dax", startDate: "04-11-2026", startTime: "04:00:00", endTime: "05:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-08 SPMP Program Planning and Policy Development for Long Tooltip Display Example", totalMinutes: 20, status: "Rejected", commentsCount: 1, commentText: "Please provide description." },
  { id: "15", employeeName: "Cohen Lea", startDate: "05-14-2026", startTime: "03:00:00", endTime: "04:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-12 Paid Time Off", totalMinutes: 385, status: "Withdraw", commentsCount: 0 },
  { id: "16", employeeName: "Fox Amy", startDate: "03-17-2026", startTime: "02:00:00", endTime: "03:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-08 SPMP Program Planning and Policy Development for Long Tooltip Display Example", totalMinutes: 30, status: "Approved", commentsCount: 0 },
  { id: "17", employeeName: "Hart Eli", startDate: "04-20-2026", startTime: "01:00:00", endTime: "02:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-12 Paid Time Off", totalMinutes: 375, status: "Rejected", commentsCount: 2, commentText: "Payroll needs clarification for entry #17." },
  { id: "18", employeeName: "Ivy Noor", startDate: "05-23-2026", startTime: "00:00:00", endTime: "01:15:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-08 SPMP Program Planning and Policy Development for Long Tooltip Display Example", totalMinutes: 20, status: "Withdraw", commentsCount: 0 },
  { id: "19", employeeName: "Khan Omar", startDate: "03-26-2026", startTime: "12:30:00", endTime: "13:45:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-12 Paid Time Off", totalMinutes: 385, status: "Approved", commentsCount: 0 },
  { id: "20", employeeName: "Lane Rose", startDate: "04-29-2026", startTime: "13:30:00", endTime: "14:45:00", programCode: "PH PH-PH- General PH Time - undefined", activityCode: "FFP-08 SPMP Program Planning and Policy Development for Long Tooltip Display Example", totalMinutes: 30, status: "Rejected", commentsCount: 1, commentText: "Please provide description." },
]

const USERS: LeaveApprovalUserOption[] = [
  { id: "all", label: "All" },
  ...mockSeedRows.map((r) => ({ id: toUserId(r.employeeName), label: r.employeeName })),
]

let ROWS: LeaveApprovalRow[] = [...mockSeedRows]

export function updateMockLeaveApprovalRow(
  id: string,
  patch: Partial<Pick<LeaveApprovalRow, "status" | "commentText" | "commentsCount">>,
) {
  ROWS = ROWS.map((r) => (r.id === id ? { ...r, ...patch } : r))
}

function compareEmployeeName(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true })
}

function compareStartDate(a: string, b: string) {
  // Format is MM-DD-YYYY; compare YYYYMMDD numeric for stability.
  const toKey = (v: string) => {
    const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(v)
    if (!m) return 0
    return Number(`${m[3]}${m[1]}${m[2]}`)
  }
  return toKey(a) - toKey(b)
}

export function getMockLeaveApprovals(params: GetLeaveApprovalsParams): LeaveApprovalListResponse {
  const { page, pageSize, filters, sort } = params

  const statusFilter: LeaveApprovalStatus | null =
    filters.type === "All" ? null : (filters.type as LeaveApprovalStatus)

  const userId = filters.userId && filters.userId !== "all" ? filters.userId : undefined

  let items = ROWS.filter((row) => {
    if (statusFilter && row.status !== statusFilter) return false
    if (userId) {
      const normalized = row.employeeName.toLowerCase().replace(/\s+/g, "-")
      if (normalized !== userId) return false
    }
    return true
  })

  if (sort) {
    items = [...items].sort((a, b) => {
      const cmp =
        sort.key === "employeeName"
          ? compareEmployeeName(a.employeeName, b.employeeName)
          : compareStartDate(a.startDate, b.startDate)
      return sort.direction === "asc" ? cmp : -cmp
    })
  }

  const totalItems = items.length
  const safePageSize = Math.max(1, pageSize)
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * safePageSize
  const paged = items.slice(startIndex, startIndex + safePageSize)

  return {
    items: paged,
    totalItems,
    userOptions: USERS,
  }
}

