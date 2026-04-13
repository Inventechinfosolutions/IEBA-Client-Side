import { z } from "zod"

import { loginSettingsSchema } from "@/features/settings/components/Login/schema"
import { generalSettingsSchema } from "@/features/settings/components/General/schema"
import { reportsSettingsSchema } from "@/features/settings/components/Reports/schema"
import { countySettingsSchema } from "@/features/settings/components/Country/schema"
import { fiscalYearSettingsSchema } from "@/features/settings/components/FiscalYear/schema"
import { payrollSettingsSchema } from "@/features/settings/payroll/components/schema"

export const settingsFormSchema = z.object({
  county: countySettingsSchema,
  general: generalSettingsSchema,
  reports: reportsSettingsSchema,
  login: loginSettingsSchema,
  fiscalYear: fiscalYearSettingsSchema,
  payroll: payrollSettingsSchema,
})

