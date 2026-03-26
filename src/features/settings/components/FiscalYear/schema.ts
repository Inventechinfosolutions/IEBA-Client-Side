import { z } from "zod"

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

function isoToDisplayDdMmYyyy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const yyyy = m[1]
  const mm = m[2]
  const dd = m[3]
  return `${dd}-${mm}-${yyyy}`
}

function parseYearRangeLabel(value: string): { startYear: string; endYear: string } | null {
  const m = /^(\d{4})-(\d{4})$/.exec(value.trim())
  if (!m) return null
  return { startYear: m[1], endYear: m[2] }
}

export const fiscalYearHolidaySchema = z.object({
  date: z.string().regex(isoDateRegex, "Holiday date is required"),
  holiday: z.string().trim().min(1, "Holiday name is required"),
  optional: z.boolean().default(false),
})

export const fiscalYearSettingsSchema = z
  .object({
    fiscalYearStartMonth: z.string().regex(isoDateRegex, "Fiscal Year Start Month is required"),
    fiscalYearEndMonth: z.string().regex(isoDateRegex, "Fiscal Year End Month is required"),
    year: z.string().trim().min(1, "Year is required"),
    appliedYearRanges: z.array(z.string().trim().min(1)).default([]),
    holidays: z.array(fiscalYearHolidaySchema).default([]),
  })
  .superRefine((data, ctx) => {
    const years = parseYearRangeLabel(data.year)
    if (!years) return

    const start = `${years.startYear}-01-01`
    const end = `${years.endYear}-12-31`
    if (!isoDateRegex.test(start) || !isoDateRegex.test(end)) return

    data.holidays.forEach((row, i) => {
      if (!isoDateRegex.test(row.date)) return
      if (row.date < start || row.date > end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Holiday date (${isoToDisplayDdMmYyyy(row.date)}) must be between fiscal start and end (${isoToDisplayDdMmYyyy(start)} and ${isoToDisplayDdMmYyyy(end)}).`,
          path: ["holidays", i, "date"],
        })
      }
    })
  })
