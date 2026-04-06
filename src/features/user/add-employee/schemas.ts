import { z } from "zod"

/** US mobile: 10 digits, shown as ___-___-____ (3-3-4). */
const PHONE_US10_LEN = 10

export function phoneDigitsOnly(raw: string): string {
  return raw.replace(/\D/g, "")
}

function formatPhoneUs10Digits(digits10: string): string {
  return `${digits10.slice(0, 3)}-${digits10.slice(3, 6)}-${digits10.slice(6, PHONE_US10_LEN)}`
}

/** While typing: cap at 10 digits, insert hyphens. */
export function formatPhoneUs10Input(raw: string): string {
  const d = phoneDigitsOnly(raw).slice(0, PHONE_US10_LEN)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  return formatPhoneUs10Digits(d)
}

/** 10 digits or 11 with leading 1 → XXX-XXX-XXXX; else unchanged trim. */
export function normalizePhoneForFormDisplay(raw: string): string {
  const t = raw.trim()
  if (t === "") return ""
  let d = phoneDigitsOnly(t)
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1)
  if (d.length === PHONE_US10_LEN) return formatPhoneUs10Digits(d)
  return t
}

/**
 * Hint when continuing the wizard (Next) from Employee/Login Details with invalid data.
 * Kept beside the Zod schema so copy stays in sync with validation.
 */
export const ADD_EMPLOYEE_SAVE_TO_MOVE_NEXT_MESSAGE = "Save details to move next"

/** Shown when Next is clicked on tabs 1–3 in create mode after validation passes but Save has not succeeded on that tab yet. */
export const ADD_EMPLOYEE_MUST_SAVE_BEFORE_NEXT: Record<
  "employee" | "security" | "supervisor",
  string
> = {
  employee: "You cannot proceed further until you saved the Employee Details.",
  security: "You cannot proceed further until you saved the Security/Assignments.",
  supervisor: "You cannot proceed further until you saved the Supervisor Assignments.",
}

/** Supervisor tab requires at least one Security assignment (department role) to load options and proceed. */
export const ADD_EMPLOYEE_SUPERVISOR_NEEDS_SECURITY_ASSIGNMENTS =
  "Assign at least one department role on Security before opening Supervisor."

/** All fields except password pair (no refinements — safe to extend for create vs edit). */
const userModuleFormFieldsSchema = z.object({
  employeeNo: z.string().trim().min(1, "Employee number can't be empty"),
  positionNo: z.string().trim().optional(),
  /** Selected row from GET /location (submitted as `locationId` on create/update). */
  locationId: z.number().int().positive().optional(),
  /** Display name; kept in sync with the location picker for list/detail views. */
  location: z.string().trim().optional(),
  firstName: z.string().trim().min(1, "First Name can't be empty"),
  lastName: z.string().trim().min(1, "Last Name can't be empty"),
  phone: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (val === "") return
      const digits = phoneDigitsOnly(val)
      if (digits.length !== PHONE_US10_LEN) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Phone must be ${PHONE_US10_LEN} digits (___-___-____)`,
        })
      }
    })
    .transform((val) => {
      if (val.trim() === "") return ""
      const digits = phoneDigitsOnly(val)
      return digits.length === PHONE_US10_LEN ? formatPhoneUs10Digits(digits) : val
    }),
  loginId: z.string().trim().min(1, "Login Id can't be empty"),
  emailAddress: z.string().trim().optional().or(z.literal("")),
  jobClassification: z.string().trim().min(1, "Job Classification can't be empty"),
  jobDutyStatement: z.string().trim().optional(),
  claimingUnit: z.string().trim().min(1, "Claiming Unit can't be empty"),
  spmp: z.boolean(),
  multilingual: z.boolean(),
  allowMultiCodes: z.boolean(),
  active: z.boolean(),
  pkiUser: z.boolean(),
  roleAssignments: z.array(z.string().trim()),
  /** Add flow: Security rows in Assigned (catalog id `deptId-roleId` + departmentId for GET /users/supervisors). */
  securityAssignedSnapshots: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string(),
      departmentId: z.number().int().positive(),
      department: z.string(),
    }),
  ),
  supervisorPrimary: z.string().trim().optional(),
  supervisorSecondary: z.string().trim().optional(),
  /** User profile UUIDs for PUT /users/:id (primarySupervisorId / backupSupervisorId). */
  supervisorPrimaryId: z.string().trim().optional(),
  supervisorSecondaryId: z.string().trim().optional(),
  tsMinDay: z.string().trim().optional(),
  programs: z.boolean(),
  activities: z.boolean(),
  supervisorApportioning: z.boolean(),
  clientAdmin: z.boolean(),
  assignedMultiCodes: z.string().trim().optional(),
})

const passwordMatchRefine = {
  message: "Passwords didn't match",
  path: ["confirmPassword"],
}

const supervisorsMustDifferRefine = {
  message: "Primary and backup supervisor must be different",
  path: ["supervisorSecondary"],
}

function supervisorsAreDistinct(values: {
  supervisorPrimaryId?: string | undefined
  supervisorSecondaryId?: string | undefined
  supervisorPrimary?: string | undefined
  supervisorSecondary?: string | undefined
}): boolean {
  const idP = (values.supervisorPrimaryId ?? "").trim()
  const idS = (values.supervisorSecondaryId ?? "").trim()
  if (idP !== "" && idS !== "") return idP !== idS
  const p = (values.supervisorPrimary ?? "").trim()
  const s = (values.supervisorSecondary ?? "").trim()
  if (p === "" || s === "") return true
  return p !== s
}

export const userModuleFormSchema = userModuleFormFieldsSchema
  .extend({
    password: z
      .string()
      .trim()
      .min(1, "Password can't be empty")
      .min(11, "Password must be at least 11 characters long")
      .regex(/[A-Z]/, "Password must contain at least one capital letter")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one symbol"),
    confirmPassword: z.string().trim().min(1, "Confirm Password can't be empty"),
  })
  .refine((values) => values.password === values.confirmPassword, passwordMatchRefine)
  .refine((values) => supervisorsAreDistinct(values), supervisorsMustDifferRefine)
// Next-button UX uses ADD_EMPLOYEE_SAVE_TO_MOVE_NEXT_MESSAGE when Tab 1 validation fails (see use-add-employee-form).

/** Edit existing user: password can stay empty (unchanged); if set, same rules as create. */
export const userModuleFormEditSchema = userModuleFormFieldsSchema
  .extend({
    password: z.string().trim().superRefine((val, ctx) => {
      if (val === "") return
      if (val.length < 11) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must be at least 11 characters long",
        })
      }
      if (!/[A-Z]/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must contain at least one capital letter",
        })
      }
      if (!/[^A-Za-z0-9]/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must contain at least one symbol",
        })
      }
    }),
    confirmPassword: z.string().trim(),
  })
  .refine((values) => values.password === values.confirmPassword, passwordMatchRefine)
  .refine((values) => supervisorsAreDistinct(values), supervisorsMustDifferRefine)

