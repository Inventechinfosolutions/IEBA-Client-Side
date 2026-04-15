import { z } from "zod"
import { generalSettingsSchema } from "./schema"

export type GeneralSettingsModel = {
  screenInactivityTimeMinutes: number
}


export type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>

export interface AppLogoutProps {
}
