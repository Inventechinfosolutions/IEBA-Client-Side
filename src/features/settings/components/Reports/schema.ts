import { z } from "zod"

export const reportsSettingsSchema = z.object({
  departmentId: z.string().trim().default(""),
  reportKey: z.string().trim().default(""),
  masterCodeExclusionMode: z.enum(["exclude", "include"]).default("exclude"),
  activityExclusionMode: z.enum(["exclude", "include"]).default("exclude"),
  excludedMasterCodeIds: z.array(z.string().trim()).default([]),
  includedMasterCodeIds: z.array(z.string().trim()).default([]),
  excludedActivityCodes: z.array(z.string().trim()).default([]),
  includedActivityCodes: z.array(z.string().trim()).default([]),
  includedProgramCodes: z.array(z.string().trim()).default([]),
  excludedProgramCodes: z.array(z.string().trim()).default([]),
  category1Programs: z.array(z.string().trim()).default([]),
  category2Programs: z.array(z.string().trim()).default([]),
  category3Programs: z.array(z.string().trim()).default([]),
})
