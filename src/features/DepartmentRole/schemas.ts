import { z } from "zod"

export const departmentRoleFormSchema = z.object({
  departmentName: z.string().min(1, "Department name is required"),
  rolesText: z
    .string()
    .min(1, "At least one role is required")
    .refine(
      (val) => val.split(",").map((r) => r.trim()).filter(Boolean).length >= 1,
      "At least one role is required"
    ),
  status: z.enum(["active", "inactive"]),
})

export type DepartmentRoleFormSchema = z.infer<typeof departmentRoleFormSchema>

export const addRoleFormSchema = z.object({
  department: z.string().min(1, "Department is required"),
  roleName: z.string().min(1, "Role name is required"),
  active: z.boolean(),
  assignedPermissions: z.array(z.string()),
})

export type AddRoleFormSchema = z.infer<typeof addRoleFormSchema>
