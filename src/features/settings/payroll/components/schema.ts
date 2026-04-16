import { z } from "zod"

export const payrollColumnSettingSchema = z.object({
  key: z.string().trim().min(1, "Column key is required"),
  label: z.string().trim().min(1, "Column name is required"),
  enabled: z.boolean().default(true),
  editable: z.boolean().default(false),
})

export const payrollSettingsSchema = z.object({
  payrollBy: z.enum(["Weekly", "Bi-Weekly", "Semi-Monthly", "Monthly"]).default("Weekly"),
  columns: z.array(payrollColumnSettingSchema).default([]),
})

