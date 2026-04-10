import { z } from "zod"

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

export const fiscalYearHolidaySchema = z.object({
  date: z.string().regex(isoDateRegex, "Holiday date is required"),
  holiday: z.string().trim().min(1, "Holiday name is required"),
  optional: z.boolean().default(false),
})

/** Main settings form: fiscal dates load from `/setting/fiscalyear`; holidays use the holiday API (always `[]` here). */
export const fiscalYearSettingsSchema = z.object({
  fiscalYearStartMonth: z.string(),
  fiscalYearEndMonth: z.string(),
  year: z.string(),
  appliedYearRanges: z.array(z.string().trim().min(1)).default([]),
  holidays: z.array(fiscalYearHolidaySchema).default([]),
})

/** Validates month pickers before `PUT /setting/fiscal-year/update`. */
export const fiscalYearUpsertFormSchema = z
  .object({
    fiscalYearStartMonth: z.string().regex(isoDateRegex, "Fiscal Year Start Month is required"),
    fiscalYearEndMonth: z.string().regex(isoDateRegex, "Fiscal Year End Month is required"),
  })
  .refine((data) => data.fiscalYearStartMonth <= data.fiscalYearEndMonth, {
    message: "Fiscal start must be on or before fiscal end",
    path: ["fiscalYearEndMonth"],
  })
