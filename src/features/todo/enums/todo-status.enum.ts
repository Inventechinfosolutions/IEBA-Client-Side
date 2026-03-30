/** Mirrors `generaladmin/todo/entity/enums/todo-status.enum.ts` on the backend. */
export const TodoStatusEnum = {
  NEW: "new",
  INPROGRESS: "inprogress",
  COMPLETED: "completed",
} as const

export type TodoStatusEnum = (typeof TodoStatusEnum)[keyof typeof TodoStatusEnum]
