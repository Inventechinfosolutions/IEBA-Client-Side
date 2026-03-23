import { z } from "zod"

export const todoFormSchema = z.object({
  title: z.string().trim().min(1, "Title can't be empty"),
  description: z.string().trim().optional(),
  status: z.enum(["New", "In progress", "Completed"]),
})
