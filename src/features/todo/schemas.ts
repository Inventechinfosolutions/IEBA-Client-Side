import { z } from "zod"

import { TodoStatusEnum } from "./enums/todo-status.enum"

const todoStatusValues = Object.values(TodoStatusEnum) as [
  typeof TodoStatusEnum.NEW,
  typeof TodoStatusEnum.INPROGRESS,
  typeof TodoStatusEnum.COMPLETED,
]

export const todoFormSchema = z.object({
  title: z.string().trim().min(1, "Please enter title"),
  description: z.string().trim().min(1, "Please enter description"),
  status: z.enum(todoStatusValues, {
    message: "Please select status",
  }),
})
