export const leaveApprovalKeys = {
  all: ["leave-approval"] as const,
  lists: () => [...leaveApprovalKeys.all, "list"] as const,
  list: (params: unknown) => [...leaveApprovalKeys.lists(), params] as const,
}

