import { z } from "zod"

export const generalSettingsSchema = z.object({
  screenInactivityTimeMinutes: z.coerce
    .number()
    .int()
    .min(1, "Screen Inactivity Time is required")
    .max(9999, "Screen Inactivity Time is too large"),
})

