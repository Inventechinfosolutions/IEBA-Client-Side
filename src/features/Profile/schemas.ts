import { z } from "zod"

import { UserRelationship } from "./enums/userrelationship.enum"
import type { ProfileDetailFormValues } from "./types"

const requiredNonEmptyString = (fieldLabel: string) =>
  z.string().trim().min(1, `${fieldLabel} is required`)

const optionalDigitsWithLen = (fieldLabel: string, len: number) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === "" || new RegExp(`^\\d{${len}}$`).test(value),
      `${fieldLabel} must be ${len} digits`
    )

/** Accepts masked values like `000-000-0000` and validates by digit count. */
const optionalPhoneDigitsLen = (fieldLabel: string, len: number) =>
  z
    .string()
    .trim()
    .refine(
      (value) => {
        const digitsOnly = (value ?? "").replaceAll(/\D/g, "")
        return digitsOnly === "" || new RegExp(`^\\d{${len}}$`).test(digitsOnly)
      },
      `${fieldLabel} must be ${len} digits`
    )

const relationshipField = z.union([z.literal(""), z.nativeEnum(UserRelationship)])

/** Matches backend `combinedEmergencyPhoneDigits` — if any digits are present, they must total exactly 10. */
function emergencyContactPhoneDigits(areaCode: string, telephoneNumber: string): string {
  const a = areaCode.replaceAll(/\D/g, "")
  const t = telephoneNumber.replaceAll(/\D/g, "")
  if (a.length === 3 && t.length === 7) return `${a}${t}`
  if (t.length === 10) return t
  return `${a}${t}`
}

export const profileDetailFormSchema = z.object({
  firstName: requiredNonEmptyString("First Name"),
  mi: z.string().trim().max(2),
  lastName: requiredNonEmptyString("Last Name"),
  areaCode: optionalDigitsWithLen("Area Code", 3),
  telephoneNumber: optionalPhoneDigitsLen("Telephone Number", 10),
  emergencyContact: z
    .object({
      firstName: z
        .string()
        .trim()
        .max(100, "Emergency Contact First Name must be at most 100 characters"),
      lastName: z
        .string()
        .trim()
        .max(100, "Emergency Contact Last Name must be at most 100 characters"),
      areaCode: optionalDigitsWithLen("Emergency Contact Area Code", 3),
      telephoneNumber: optionalPhoneDigitsLen("Emergency Contact Telephone Number", 10),
      relationship: relationshipField,
    })
    .superRefine((ec, ctx) => {
      const digits = emergencyContactPhoneDigits(ec.areaCode, ec.telephoneNumber)
      if (digits.length > 0 && digits.length !== 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Emergency contact phone must be 10 digits (3-digit area code + 7-digit number, or 10 digits in Telephone only)",
          path: ["telephoneNumber"],
        })
      }
    }),
  onRecords: z.object({
    employeeId: requiredNonEmptyString("Employee ID").refine(
      (value) => /^\d+$/.test(value),
      "Employee ID must be digits"
    ),
    positionId: requiredNonEmptyString("Position ID"),
    jobClassification: z.string().trim(),
    jobDutyStatement: z.string().trim(),
    primarySupervisor: z.string().trim(),
    secondarySupervisor: z.string().trim(),
    emailLoginId: z.string().trim().min(1, "Email / Login ID is required").email("Invalid email address"),
    location: requiredNonEmptyString("Location"),
  }),
})

/** User-facing copy for Profile UI (toasts, alerts). Validation field messages stay on the Zod schema above. */
export const profileDetailMessages = {
  formCheckFields: "Please check the form fields.",
  imageChooseFile: "Please choose a file.",
  imageCropFailed: "Unable to crop image. Please try another file.",
  imageUpdated: "Profile image updated.",
  signInToView: "Sign in to view your profile.",
  loadProfileFailed: "Unable to load profile.",
  changesDiscarded: "Changes discarded.",
  saveSuccess: "Profile saved successfully.",
  saveFailedGeneric: "Failed to update profile.",
  relationshipPlaceholder: "Select relationship",
} as const

export const profileDetailDefaultValues: ProfileDetailFormValues = {
  firstName: "",
  mi: "",
  lastName: "",
  areaCode: "",
  telephoneNumber: "",
  emergencyContact: {
    firstName: "",
    lastName: "",
    areaCode: "",
    telephoneNumber: "",
    relationship: "",
  },
  onRecords: {
    employeeId: "",
    positionId: "",
    jobClassification: "",
    jobDutyStatement: "",
    primarySupervisor: "",
    secondarySupervisor: "",
    emailLoginId: "",
    location: "",
  },
}

