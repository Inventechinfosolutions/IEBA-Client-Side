import { z } from "zod"

export const masterCodeSettingsSchema = z.object({
  selectedMasterCodeIds: z.string().default(""),
})

export type MasterCodeSettingsModel = z.infer<typeof masterCodeSettingsSchema>
