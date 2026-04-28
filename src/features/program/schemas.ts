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
  hasActiveSubProgramOne: z.boolean().optional(),
  hasActiveSubProgramTwo: z.boolean().optional(),
  isMultiCode: z.boolean().optional(),
  multiCodeType: z.string().optional(),
  parentActive: z.boolean().optional(),
})

// ─── Budget Units tab schema ───────────────────────────────────────────────
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

  // ── Status hierarchy rules ────────────────────────────────────────────────
  // Rule: A child CANNOT be set to Active when its direct parent is Inactive.
  // Deactivation is always allowed — the backend cascades status to children.

  if (values.formSection === "BU Program") {
    // Level 1: parent is the Budget Unit (Level 0)
    if (values.active && values.parentActive === false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["active"],
        message: "Cannot activate: Parent Budget Unit is inactive. Please activate it first.",
      })
    }
  }

  if (values.formSection === "BU Sub-Program") {
    // Level 2: parent is the BU Program (Level 1)
    if (values.active && values.parentActive === false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["active"],
        message: "Cannot activate: Parent BU Program is inactive. Please activate it first.",
      })
    }
  }
})

// ─── Time Study Programs tab schema ───────────────────────────────────────
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

  // ── Status hierarchy rules ────────────────────────────────────────────────
  // Time Study hierarchy mapping:
  //   formSection "BU Program"     → Level 0 (TS Primary)   — no parent
  //   formSection "BU Sub-Program" → Level 1 (TS Secondary) — parent is TS Primary
  //   formSection "Budget Unit"    → Level 2 (TS Sub-Prog)  — parent is TS Secondary

  if (values.formSection === "BU Sub-Program") {
    // Level 1 (TS Secondary): parent is the TS Primary
    if (values.active && values.parentActive === false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["active"],
        message: "Cannot activate: Parent TS Primary Program is inactive. Please activate it first.",
      })
    }
  }

  if (values.formSection === "Budget Unit") {
    // Level 2 (TS Sub-Program Two): parent is the TS Secondary
    if (values.active && values.parentActive === false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["active"],
        message: "Cannot activate: Parent TS Sub-Program One is inactive. Please activate it first.",
      })
    }
  }
})


