import { z } from "zod"

export const userModuleFormSchema = z.object({
  employeeNo: z.string().trim().min(1, "Employee number can't be empty"),
  positionNo: z.string().trim().optional(),
  location: z.string().trim().optional(),
  firstName: z.string().trim().min(1, "First Name can't be empty"),
  lastName: z.string().trim().min(1, "Last Name can't be empty"),
  phone: z.string().trim().optional(),
  loginId: z.string().trim().min(1, "Login Id can't be empty"),
  password: z
    .string()
    .trim()
    .min(1, "Password can't be empty")
    .min(11, "Password must be at least 11 characters long")
    .regex(/[A-Z]/, "Password must contain at least one capital letter")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one symbol"),
  confirmPassword: z.string().trim().min(1, "Confirm Password can't be empty"),
  emailAddress: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  jobClassification: z
    .string()
    .trim()
    .min(1, "Job Classification can't be empty"),
  // jobClassification is required in form validation and toast flow
  jobDutyStatement: z.string().trim().optional(),
  claimingUnit: z.string().trim().min(1, "Claiming Unit can't be empty"),
  spmp: z.boolean(),
  multilingual: z.boolean(),
  allowMultiCodes: z.boolean(),
  active: z.boolean(),
  pkiUser: z.boolean(),
  roleAssignments: z.array(z.string().trim()),
  supervisorPrimary: z.string().trim().optional(),
  supervisorSecondary: z.string().trim().optional(),
  tsMinDay: z.string().trim().optional(),
  programs: z.boolean(),
  activities: z.boolean(),
  supervisorApportioning: z.boolean(),
  assignedMultiCodes: z.string().trim().optional(),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords didn't match",
  path: ["confirmPassword"],
})
