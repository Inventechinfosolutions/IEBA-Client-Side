import { z } from "zod"

import { CountyActivityCatalogMatchDefault } from "./enums/CountyActivity.enum"
import type {
  CountyActivityAddFormValues,
  CountyActivityFilterFormValues,
} from "./types"

export const countyActivityFilterFormSchema = z.object({
  search: z.string().trim(),
  inactive: z.boolean(),
})

export const countyActivityAddFormSchema = z.object({
  copyCode: z.boolean(),
  countyActivityCode: z.string().min(1, "County activity code is required"),
  countyActivityName: z.string().min(1, "County activity name is required"),
  description: z.string().min(1, "Description is required"),
  
  department: z.string(),
  /** Empty while adding is allowed; primary save still validates type + code in the table handler. */
  masterCodeType: z.string(),
  masterCode: z.number().int().nonnegative("Master code must be 0 or more"),
  match: z
    .string()
    .trim()
    .max(5, "Match must be at most 5 characters")
    .transform((val) => {
      if (!val) return CountyActivityCatalogMatchDefault.NONE
      return /^[a-z]+$/i.test(val) ? val.toUpperCase() : val
    }),
  percentage: z
    .number()
    .min(0, "Percentage must be between 0 and 100")
    .max(100, "Percentage must be between 0 and 100"),
  active: z.boolean(),
  leaveCode: z.boolean(),
  docRequired: z.boolean(),
  multipleJobPools: z.boolean(),
})

export const countyActivityAddDefaultValues: CountyActivityAddFormValues = {
  copyCode: false,
  countyActivityCode: "",
  countyActivityName: "",
  description: "",
  department: "",
  masterCodeType: "",
  masterCode: 0,
  match: CountyActivityCatalogMatchDefault.NONE,
  percentage: 0,
  active: true,
  leaveCode: false,
  docRequired: false,
  multipleJobPools: true,
}

export const countyActivityFilterDefaultValues: CountyActivityFilterFormValues = {
  search: "",
  inactive: false,
}
