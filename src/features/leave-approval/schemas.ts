import { z } from "zod"

import { leaveApprovalStatusLabel, leaveApprovalStatusValues } from "./enums/leaveApprovalStatus"

const filterStatusOptions = leaveApprovalStatusValues
  .filter((s) => s !== "draft")
  .map((s) => leaveApprovalStatusLabel[s]) as [
  string,
  ...string[],
]

export const leaveApprovalFiltersSchema = z.object({
  type: z.enum(["All", ...filterStatusOptions]),
  userId: z.string().optional(),
})

