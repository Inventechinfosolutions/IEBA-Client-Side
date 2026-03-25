import { z } from "zod"

export const reportsSettingsSchema = z.object({
  reportKey: z.string().trim().min(1, "Reports is required"),
  exclusionMode: z.enum(["exclude", "include"]).default("exclude"),
  selectedActivityCodes: z.array(z.string().trim()).default([]),
})

