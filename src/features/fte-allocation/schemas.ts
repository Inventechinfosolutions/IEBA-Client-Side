import { z } from "zod"

import type {
  FteFilterFormValues,
  MomUpdateFormValues,
  ProgramsUpdateFormValues,
} from "./types"

// ─── Filter form ─────────────────────────────────────────────────────────────

export const fteFilterFormSchema = z.object({
  fiscalYearId: z.string().min(1, "Fiscal year is required"),
  search: z.string().trim(),
  inactive: z.boolean(),
})

export const fteFilterDefaultValues: FteFilterFormValues = {
  fiscalYearId: "",
  search: "",
  inactive: false,
}

// ─── MOM update form ─────────────────────────────────────────────────────────
// Each program row captures 12 month values (0-1 FTE fractions)

const momMonthValueSchema = z
  .number()
  .min(0, "Must be ≥ 0")
  .max(1, "Must be ≤ 1")

export const momUpdateFormSchema = z.object({
  programId: z.string().min(1),
  Jul: momMonthValueSchema,
  Aug: momMonthValueSchema,
  Sep: momMonthValueSchema,
  Oct: momMonthValueSchema,
  Nov: momMonthValueSchema,
  Dec: momMonthValueSchema,
  Jan: momMonthValueSchema,
  Feb: momMonthValueSchema,
  Mar: momMonthValueSchema,
  Apr: momMonthValueSchema,
  May: momMonthValueSchema,
  Jun: momMonthValueSchema,
}) satisfies z.ZodType<MomUpdateFormValues>

// ─── Programs update form ───────────────────────────────────────────────────

export const programsUpdateFormSchema = z.object({
  programs: z.array(
    z.object({
      id: z.string(),
      program: z.string(),
      budgetedFte: z.number().min(0, "Must be ≥ 0").max(9999, "Must be ≤ 9999"),
      allocatedFte: z.number().min(0, "Must be ≥ 0").max(9999, "Must be ≤ 9999"),
      momAllocations: z.record(z.string(), z.number()),
    })
  ),
}) satisfies z.ZodType<ProgramsUpdateFormValues>
