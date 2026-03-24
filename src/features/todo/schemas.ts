import { z } from "zod"

export const todoFormSchema = z.object({
  title: z.string().trim().min(1, "Please enter title"),
  description: z.string().trim().min(1, "Please enter description"),
  status: z.enum(["New", "In progress", "Completed"], {
    message: "Please select status",
  }),
})
