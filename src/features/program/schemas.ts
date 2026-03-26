import { z } from "zod"

const programFormBaseSchema = z.object({
  formSection: z.enum(["Budget Unit", "BU Program", "BU Sub-Program"]),
  active: z.boolean(),
  costAllocation: z.boolean(),
  budgetUnitDepartment: z.string().trim(),
  budgetUnitCode: z.string().trim(),
  budgetUnitName: z.string().trim(),
  budgetUnitDescription: z.string().trim(),
  budgetUnitMedicalPct: z.string().trim(),
  buProgramBudgetUnitName: z.string().trim(),
  buProgramCode: z.string().trim(),
  buProgramDepartment: z.string().trim(),
  buProgramProgramCode: z.string().trim(),
  buProgramProgramName: z.string().trim(),
  buProgramDescription: z.string().trim(),
  buProgramMedicalPct: z.string().trim(),
  buSubProgramBudgetUnitProgramName: z.string().trim(),
  buSubProgramBudgetCode: z.string().trim(),
  buSubProgramDepartment: z.string().trim(),
  buSubProgramCode: z.string().trim(),
  buSubProgramName: z.string().trim(),
  buSubProgramDescription: z.string().trim(),
  buSubProgramMedicalPct: z.string().trim(),
  programActivityRelationDepartment: z.string().trim(),
  programActivityRelationProgram: z.string().trim(),
  programActivityRelationSort: z.string().trim(),
})

export const programFormSchema = programFormBaseSchema.superRefine((values, ctx) => {
    const budgetUnitDepartmentField = "budgetUnitDepartment"
    const buProgramFirstField = "buProgramBudgetUnitName"
    const buSubProgramFirstField = "buSubProgramBudgetUnitProgramName"

    const requiredBySection: Record<typeof values.formSection, string[]> = {
      "Budget Unit": [
        "budgetUnitDepartment",
        "budgetUnitCode",
        "budgetUnitName",
        "budgetUnitDescription",
        "budgetUnitMedicalPct",
      ],
      "BU Program": [
        "buProgramBudgetUnitName",
        "buProgramCode",
        "buProgramDepartment",
        "buProgramProgramCode",
        "buProgramProgramName",
        "buProgramDescription",
        "buProgramMedicalPct",
      ],
      "BU Sub-Program": [
        "buSubProgramBudgetUnitProgramName",
        "buSubProgramBudgetCode",
        "buSubProgramDepartment",
        "buSubProgramCode",
        "buSubProgramName",
        "buSubProgramDescription",
        "buSubProgramMedicalPct",
      ],
    }

    for (const field of requiredBySection[values.formSection]) {
      const key = field as keyof typeof values
      if (!values[key]) {
        let message = "Please fill all the required fields"
        if (field === budgetUnitDepartmentField) message = "Please Select Department"
        if (field === buProgramFirstField) message = "Please Select Budget Unit"
        if (field === buSubProgramFirstField) message = "Please Select Budget Program"
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message,
        })
      }
    }
  })

export const timeStudyProgramFormSchema = programFormBaseSchema.superRefine((values, ctx) => {
  const requiredBySection: Record<typeof values.formSection, (keyof typeof values)[]> = {
    "Budget Unit": [
      "budgetUnitName",
      "budgetUnitCode",
      "budgetUnitDepartment",
      "budgetUnitDescription",
      "buProgramProgramName",
      "buProgramProgramCode",
    ],
    "BU Program": [
      "buProgramDepartment",
      "buProgramBudgetUnitName",
      "buProgramProgramName",
      "buProgramProgramCode",
    ],
    "BU Sub-Program": [
      "buSubProgramBudgetUnitProgramName",
      "buSubProgramDepartment",
      "buSubProgramBudgetCode",
      "buSubProgramName",
      "buSubProgramCode",
    ],
  }

  for (const field of requiredBySection[values.formSection]) {
    if (!values[field]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: "Please fill all the required fields",
      })
    }
  }
})
