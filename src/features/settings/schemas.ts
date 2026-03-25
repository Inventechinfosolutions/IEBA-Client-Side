import { z } from "zod"

const timeString = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")

const countyAddressRowSchema = z
  .object({
    location: z.string().trim().default(""),
    street: z.string().trim().default(""),
    city: z.string().trim().default(""),
    state: z.string().trim().default(""),
    zip: z.string().trim().default(""),
  })
  .superRefine((row, ctx) => {
    const fields: (keyof typeof row)[] = ["location", "street", "city", "state", "zip"]
    const anyFilled = fields.some((key) => (row[key] ?? "").trim().length > 0)
    if (!anyFilled) return

    if (!row.location?.trim()) {
      ctx.addIssue({ code: "custom", path: ["location"], message: "Location is required" })
    }
    if (!row.street?.trim()) {
      ctx.addIssue({ code: "custom", path: ["street"], message: "Street is required" })
    }
    if (!row.city?.trim()) {
      ctx.addIssue({ code: "custom", path: ["city"], message: "City is required" })
    }
    if (!row.state?.trim()) {
      ctx.addIssue({ code: "custom", path: ["state"], message: "State is required" })
    }
    if (!row.zip?.trim()) {
      ctx.addIssue({ code: "custom", path: ["zip"], message: "Zip is required" })
    } else if (!/^\d{5}(-\d{4})?$/.test(row.zip.trim())) {
      ctx.addIssue({ code: "custom", path: ["zip"], message: "Invalid zip code" })
    }
  })

export const settingsFormSchema = z.object({
  county: z.object({
    logoDataUrl: z.string().nullable().default(null),
    countyName: z.string().trim().min(1, "County Name is required"),
    welcomeMessage: z.string().trim().default(""),
    startTime1: timeString,
    startTime2: timeString,
    endTime: timeString,
    includedWeekends: z.boolean(),
    autoApproval: z.boolean(),
    supervisorApportioning: z.boolean(),
    addresses: z.array(countyAddressRowSchema).default([]),
  }),
})

