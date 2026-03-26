import { z } from "zod"
import type {
  CountyActivityAddFormValues,
  CountyActivityFilterFormValues,
} from "./types"

export const countyActivityFilterFormSchema = z.object({
  search: z.string().trim(),
  inactive: z.boolean(),
})

export const countyActivityAddFormSchema = z.object({
  countyActivityCode: z.string().min(1, "County activity code is required"),
  countyActivityName: z.string().min(1, "County activity name is required"),
  description: z.string().min(1, "Description is required"),
  // NOTE: Sub-county rows intentionally keep these blank in the table.
  // Primary-tab validation is enforced in the form UI logic.
  department: z.string(),
  masterCodeType: z.string(),
  masterCode: z.number().int().nonnegative("Master code must be 0 or more"),
  match: z.enum(["N", "E", "N/M", "E/N"]),
  percentage: z
    .number()
    .min(0, "Percentage must be between 0 and 100")
    .max(100, "Percentage must be between 0 and 100"),
  active: z.boolean(),
  leaveCode: z.boolean(),
  multipleJobPools: z.boolean(),
})

export const countyActivityAddDefaultValues: CountyActivityAddFormValues = {
  countyActivityCode: "",
  countyActivityName: "",
  description: "",
  department: "",
  masterCodeType: "FFP",
  masterCode: 0,
  match: "N",
  percentage: 0,
  active: true,
  leaveCode: false,
  multipleJobPools: true,
}

export const countyActivityFilterDefaultValues: CountyActivityFilterFormValues = {
  search: "",
  inactive: false,
}
