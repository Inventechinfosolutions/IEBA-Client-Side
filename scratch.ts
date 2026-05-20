import { z } from "zod";
const countyActivityAddFormSchema = z.object({
  copyCode: z.boolean(),
  countyActivityCode: z.string().min(1, "County activity code is required"),
  countyActivityName: z.string().min(1, "County activity name is required"),
  description: z.string(),
  department: z.string(),
  masterCodeType: z.string(),
  masterCode: z.number().int().nonnegative("Master code must be 0 or more"),
  match: z
    .string()
    .trim()
    .max(5, "Match must be at most 5 characters")
    .transform((val) => {
      if (!val) return "NONE";
      return /^[a-z]+$/i.test(val) ? val.toUpperCase() : val;
    }),
  percentage: z
    .number()
    .min(0, "Percentage must be between 0 and 100")
    .max(100, "Percentage must be between 0 and 100"),
  active: z.boolean(),
  leaveCode: z.boolean(),
  docRequired: z.boolean(),
  multipleJobPools: z.boolean(),
  apportioning: z.boolean(),
});

const values = {
  copyCode: false,
  countyActivityCode: "00012",
  countyActivityName: "Referral, Coordination, and Monitoring of Non  Medi-Cal Services",
  description: "Making referrals for or coordinating services that are not covered by Med-Cal . Includes gathering information in advance of the referral and all follow-up.",
  masterCodeType: "MAA",
  masterCode: 5,
  match: "NONE",
  percentage: 0,
  active: true,
  leaveCode: false,
  docRequired: false,
  multipleJobPools: true,
  department: "Behavioral Health, Public Health, Social Services, Veterans Service Office",
  apportioning: true,
};

const result = countyActivityAddFormSchema.safeParse(values);
console.log(JSON.stringify(result, null, 2));

