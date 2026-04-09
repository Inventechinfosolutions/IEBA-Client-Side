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

const relationshipEnum = z.nativeEnum(UserRelationship)

export const profileDetailFormSchema = z.object({
  firstName: requiredNonEmptyString("First Name"),
  mi: z.string().trim().max(2),
  lastName: requiredNonEmptyString("Last Name"),
  areaCode: optionalDigitsWithLen("Area Code", 3),
  telephoneNumber: optionalPhoneDigitsLen("Telephone Number", 10),
  emergencyContact: z.object({
    firstName: requiredNonEmptyString("Emergency Contact First Name"),
    lastName: requiredNonEmptyString("Emergency Contact Last Name"),
    areaCode: optionalDigitsWithLen("Emergency Contact Area Code", 3),
    telephoneNumber: optionalPhoneDigitsLen("Emergency Contact Telephone Number", 10),
    relationship: relationshipEnum,
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
    relationship: UserRelationship.BROTHER,
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

