import { z } from "zod"

import type { CostPoolFilterFormValues, CostPoolUpsertFormValues } from "./types"

export const costPoolFilterFormSchema = z.object({
  search: z.string().trim(),
  inactive: z.boolean(),
})

export const costPoolUpsertFormSchema = z.object({
  costPool: z.string().min(1, "Cost pool is required"),
  department: z.string().min(1, "Department is required"),
  active: z.boolean(),
  assignedActivityIds: z.array(z.string()),
})

export const costPoolFilterDefaultValues: CostPoolFilterFormValues = {
  search: "",
  inactive: false,
}

export const costPoolUpsertDefaultValues: CostPoolUpsertFormValues = {
  costPool: "",
  department: "",
  active: true,
  assignedActivityIds: [],
}
