import { z } from "zod"

import type { CostPoolFilterFormValues, CostPoolUpsertFormValues } from "./types"

export const costPoolFilterFormSchema = z.object({
  search: z.string().trim(),
  inactive: z.boolean(),
})

export const costPoolUpsertFormSchema = z.object({
  costPool: z
    .string()
    .trim()
    .min(1, "Cost pool is required")
    .max(100, "Cost pool name must be at most 100 characters"),
  departmentId: z
    .number({ message: "Department is required" })
    .int()
    .positive("Department is required"),
  active: z.boolean(),
  assignedActivityDepartmentIds: z.array(z.number().int().positive()),
})

export const costPoolFilterDefaultValues: CostPoolFilterFormValues = {
  search: "",
  inactive: false,
}

export const costPoolUpsertDefaultValues: CostPoolUpsertFormValues = {
  costPool: "",
  departmentId: 0,
  active: true,
  assignedActivityDepartmentIds: [],
}
