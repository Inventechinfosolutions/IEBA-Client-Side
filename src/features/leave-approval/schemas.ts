import { z } from "zod"

export const leaveApprovalFiltersSchema = z.object({
  type: z.enum(["All", "Approved", "Rejected", "Withdraw"]),
  userId: z.string().optional(),
})

