export const LeaveApprovalStatus = {
  DRAFT: "draft",
  REQUESTED: "requested",
  APPROVED: "approved",
  REJECTED: "rejected",
  WITHDRAW: "withdraw",
} as const

export const leaveApprovalStatusValues = [
  LeaveApprovalStatus.DRAFT,
  LeaveApprovalStatus.REQUESTED,
  LeaveApprovalStatus.APPROVED,
  LeaveApprovalStatus.REJECTED,
  LeaveApprovalStatus.WITHDRAW,
] as const

export type LeaveApprovalStatusValue = (typeof leaveApprovalStatusValues)[number]

export const leaveApprovalStatusLabel: Record<LeaveApprovalStatusValue, string> = {
  [LeaveApprovalStatus.DRAFT]: "Draft",
  [LeaveApprovalStatus.REQUESTED]: "Requested",
  [LeaveApprovalStatus.APPROVED]: "Approved",
  [LeaveApprovalStatus.REJECTED]: "Rejected",
  [LeaveApprovalStatus.WITHDRAW]: "Withdraw",
}

