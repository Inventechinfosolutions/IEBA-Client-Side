import type {
  CreateProgramInput,
  GetProgramsParams,
  ProgramFormValues,
  ProgramListResponse,
  ProgramRow,
  ProgramTab,
  UpdateProgramInput,
} from "./types"

const MOCK_DELAY_MS = 250

let programRows: ProgramRow[] = []

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getRowFieldsFromValues(values: ProgramFormValues) {
  if (values.formSection === "BU Program") {
    return {
      code: values.buProgramProgramCode.trim(),
      name: values.buProgramProgramName.trim(),
      medicalPct: values.buProgramMedicalPct.trim(),
      description: values.buProgramDescription.trim(),
      department: values.buProgramDepartment.trim(),
    }
  }

  if (values.formSection === "BU Sub-Program") {
    return {
      code: values.buSubProgramCode.trim(),
      name: values.buSubProgramName.trim(),
      medicalPct: values.buSubProgramMedicalPct.trim(),
      description: values.buSubProgramDescription.trim(),
      department: values.buSubProgramDepartment.trim(),
    }
  }

  return {
    code: values.budgetUnitCode.trim(),
    name: values.budgetUnitName.trim(),
    medicalPct: values.budgetUnitMedicalPct.trim(),
    description: values.budgetUnitDescription.trim(),
    department: values.budgetUnitDepartment.trim(),
  }
}

function toRow(input: CreateProgramInput): ProgramRow {
  const fields = getRowFieldsFromValues(input.values)
  const parentBudgetUnitName =
    input.values.formSection === "BU Program"
      ? input.values.buProgramBudgetUnitName.trim()
      : undefined
  const parentProgramName =
    input.values.formSection === "BU Sub-Program"
      ? input.values.buSubProgramBudgetUnitProgramName.trim()
      : undefined

  return {
    id: crypto.randomUUID(),
    tab: input.tab,
    code: fields.code,
    name: fields.name,
    medicalPct: fields.medicalPct,
    description: fields.description,
    department: fields.department,
    active: input.values.active,
    parentBudgetUnitName,
    parentProgramName,
  }
}

function seedInitialProgramsIfEmpty() {
  if (programRows.length > 0) return

  const budgetUnits: ProgramRow[] = [
    {
      id: crypto.randomUUID(),
      tab: "Budget Units",
      code: "4112",
      name: "Mental Health",
      medicalPct: "0.00",
      description: "Public Health",
      department: "Public Health",
      active: true,
    },
    {
      id: crypto.randomUUID(),
      tab: "Budget Units",
      code: "5106",
      name: "Social Services",
      medicalPct: "0.00",
      description: "Amador Social Services",
      department: "Public Health",
      active: true,
    },
  ]

  const timeStudyPrograms: ProgramRow[] = [
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-100",
      name: "Adult Program",
      medicalPct: "10.00",
      description: "Adult time study services",
      department: "Behavioral Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-200",
      name: "CHDP Program",
      medicalPct: "5.00",
      description: "Child Health and Disability Prevention",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-201",
      name: "Immunization Program",
      medicalPct: "3.50",
      description: "Public health immunization services",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-210",
      name: "Public Health Program 01",
      medicalPct: "2.00",
      description: "Public health time study program 01",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-211",
      name: "Public Health Program 02",
      medicalPct: "2.10",
      description: "Public health time study program 02",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-212",
      name: "Public Health Program 03",
      medicalPct: "2.20",
      description: "Public health time study program 03",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-213",
      name: "Public Health Program 04",
      medicalPct: "2.30",
      description: "Public health time study program 04",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-214",
      name: "Public Health Program 05",
      medicalPct: "2.40",
      description: "Public health time study program 05",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-215",
      name: "Public Health Program 06",
      medicalPct: "2.50",
      description: "Public health time study program 06",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-216",
      name: "Public Health Program 07",
      medicalPct: "2.60",
      description: "Public health time study program 07",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-217",
      name: "Public Health Program 08",
      medicalPct: "2.70",
      description: "Public health time study program 08",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-218",
      name: "Public Health Program 09",
      medicalPct: "2.80",
      description: "Public health time study program 09",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-219",
      name: "Public Health Program 10",
      medicalPct: "2.90",
      description: "Public health time study program 10",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-220",
      name: "Public Health Program 11",
      medicalPct: "3.00",
      description: "Public health time study program 11",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-221",
      name: "Public Health Program 12",
      medicalPct: "3.10",
      description: "Public health time study program 12",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-222",
      name: "Public Health Program 13",
      medicalPct: "3.20",
      description: "Public health time study program 13",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-223",
      name: "Public Health Program 14",
      medicalPct: "3.30",
      description: "Public health time study program 14",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-224",
      name: "Public Health Program 15",
      medicalPct: "3.40",
      description: "Public health time study program 15",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-225",
      name: "Public Health Program 16",
      medicalPct: "3.50",
      description: "Public health time study program 16",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-226",
      name: "Public Health Program 17",
      medicalPct: "3.60",
      description: "Public health time study program 17",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-227",
      name: "Public Health Program 18",
      medicalPct: "3.70",
      description: "Public health time study program 18",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-228",
      name: "Public Health Program 19",
      medicalPct: "3.80",
      description: "Public health time study program 19",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-229",
      name: "Public Health Program 20",
      medicalPct: "3.90",
      description: "Public health time study program 20",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-230",
      name: "Public Health Program 21",
      medicalPct: "4.00",
      description: "Public health time study program 21",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-231",
      name: "Public Health Program 22",
      medicalPct: "4.10",
      description: "Public health time study program 22",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-232",
      name: "Public Health Program 23",
      medicalPct: "4.20",
      description: "Public health time study program 23",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-233",
      name: "Public Health Program 24",
      medicalPct: "4.30",
      description: "Public health time study program 24",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-234",
      name: "Public Health Program 25",
      medicalPct: "4.40",
      description: "Public health time study program 25",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-235",
      name: "Public Health Program 26",
      medicalPct: "4.50",
      description: "Public health time study program 26",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-236",
      name: "Public Health Program 27",
      medicalPct: "4.60",
      description: "Public health time study program 27",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-237",
      name: "Public Health Program 28",
      medicalPct: "4.70",
      description: "Public health time study program 28",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-238",
      name: "Public Health Program 29",
      medicalPct: "4.80",
      description: "Public health time study program 29",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-239",
      name: "Public Health Program 30",
      medicalPct: "4.90",
      description: "Public health time study program 30",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-240",
      name: "Public Health Program 31",
      medicalPct: "5.00",
      description: "Public health time study program 31",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-241",
      name: "Public Health Program 32",
      medicalPct: "5.10",
      description: "Public health time study program 32",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-242",
      name: "Public Health Program 33",
      medicalPct: "5.20",
      description: "Public health time study program 33",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-243",
      name: "Public Health Program 34",
      medicalPct: "5.30",
      description: "Public health time study program 34",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-244",
      name: "Public Health Program 35",
      medicalPct: "5.40",
      description: "Public health time study program 35",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-245",
      name: "Public Health Program 36",
      medicalPct: "5.50",
      description: "Public health time study program 36",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-246",
      name: "Public Health Program 37",
      medicalPct: "5.60",
      description: "Public health time study program 37",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-247",
      name: "Public Health Program 38",
      medicalPct: "5.70",
      description: "Public health time study program 38",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-248",
      name: "Public Health Program 39",
      medicalPct: "5.80",
      description: "Public health time study program 39",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-249",
      name: "Public Health Program 40",
      medicalPct: "5.90",
      description: "Public health time study program 40",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-250",
      name: "Public Health Program 41",
      medicalPct: "6.00",
      description: "Public health time study program 41",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-251",
      name: "Public Health Program 42",
      medicalPct: "6.10",
      description: "Public health time study program 42",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-252",
      name: "Public Health Program 43",
      medicalPct: "6.20",
      description: "Public health time study program 43",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-253",
      name: "Public Health Program 44",
      medicalPct: "6.30",
      description: "Public health time study program 44",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-254",
      name: "Public Health Program 45",
      medicalPct: "6.40",
      description: "Public health time study program 45",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-255",
      name: "Public Health Program 46",
      medicalPct: "6.50",
      description: "Public health time study program 46",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-256",
      name: "Public Health Program 47",
      medicalPct: "6.60",
      description: "Public health time study program 47",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-257",
      name: "Public Health Program 48",
      medicalPct: "6.70",
      description: "Public health time study program 48",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-258",
      name: "Public Health Program 49",
      medicalPct: "6.80",
      description: "Public health time study program 49",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Mental Health",
    },
    {
      id: crypto.randomUUID(),
      tab: "Time Study programs",
      code: "TSP-259",
      name: "Public Health Program 50",
      medicalPct: "6.90",
      description: "Public health time study program 50",
      department: "Public Health",
      active: true,
      parentBudgetUnitName: "Social Services",
    },
  ]

  const programActivityRelation: ProgramRow[] = [
    {
      id: crypto.randomUUID(),
      tab: "Program Activity Relation",
      code: "PAR-900",
      name: "Activity Mapping A",
      medicalPct: "6.25",
      description: "Program activity relation mapping",
      department: "Administration",
      active: true,
      parentProgramName: "Adult Program",
    },
    {
      id: crypto.randomUUID(),
      tab: "Program Activity Relation",
      code: "PAR-901",
      name: "AA",
      medicalPct: "0.00",
      description: "AA",
      department: "Public Health",
      active: true,
      parentProgramName: "Adult Program",
    },
    {
      id: crypto.randomUUID(),
      tab: "Program Activity Relation",
      code: "PAR-902",
      name: "TEST",
      medicalPct: "0.00",
      description: "TEST",
      department: "Public Health",
      active: true,
      parentProgramName: "Adult Program",
    },
    {
      id: crypto.randomUUID(),
      tab: "Program Activity Relation",
      code: "PAR-903",
      name: "EPO",
      medicalPct: "0.00",
      description: "EPO",
      department: "Public Health",
      active: true,
      parentProgramName: "Adult Program",
    },
    {
      id: crypto.randomUUID(),
      tab: "Program Activity Relation",
      code: "PAR-904",
      name: "HIV",
      medicalPct: "0.00",
      description: "HIV",
      department: "Public Health",
      active: true,
      parentProgramName: "Adult Program",
    },
    {
      id: crypto.randomUUID(),
      tab: "Program Activity Relation",
      code: "PAR-905",
      name: "Pandemic Flu",
      medicalPct: "0.00",
      description: "Pandemic Flu",
      department: "Public Health",
      active: true,
      parentProgramName: "Adult Program",
    },
    {
      id: crypto.randomUUID(),
      tab: "Program Activity Relation",
      code: "PAR-906",
      name: "MCAH",
      medicalPct: "48.10",
      description: "MCAH",
      department: "Public Health",
      active: true,
      parentProgramName: "Adult Program",
    },
    {
      id: crypto.randomUUID(),
      tab: "Program Activity Relation",
      code: "PAR-907",
      name: "PSC",
      medicalPct: "48.10",
      description: "PSC",
      department: "Public Health",
      active: true,
      parentProgramName: "Adult Program",
    },
    {
      id: crypto.randomUUID(),
      tab: "Program Activity Relation",
      code: "PAR-908",
      name: "PCG",
      medicalPct: "48.10",
      description: "PCG",
      department: "Public Health",
      active: true,
      parentProgramName: "Adult Program",
    },
    {
      id: crypto.randomUUID(),
      tab: "Program Activity Relation",
      code: "PAR-909",
      name: "CCS",
      medicalPct: "88.00",
      description: "CCS",
      department: "Public Health",
      active: true,
      parentProgramName: "Adult Program",
    },
    {
      id: crypto.randomUUID(),
      tab: "Program Activity Relation",
      code: "PAR-910",
      name: "CHDP Foster Care",
      medicalPct: "99.99",
      description: "CHDP Foster Care",
      department: "Public Health",
      active: true,
      parentProgramName: "Adult Program",
    },
  ]

  const normalizedTimeStudyPrograms = timeStudyPrograms.map((row) => ({
    ...row,
    department: "Public Health",
    parentBudgetUnitName: "Social Services",
  }))

  const normalizedProgramActivityRelation = normalizedTimeStudyPrograms.flatMap(
    (tsProgram) => {
      if (tsProgram.code !== "TSP-100") return []

      const firstTemplate = programActivityRelation[0]
      const secondTemplate = programActivityRelation[1] ?? programActivityRelation[0]

      return [
        {
          ...firstTemplate,
          id: crypto.randomUUID(),
          code: "PAR-900",
          name: "TS Sub Program One 1",
          description: `TS Sub Program One linked to ${tsProgram.name}`,
          department: "Public Health",
          parentProgramName: tsProgram.name,
        },
        {
          ...secondTemplate,
          id: crypto.randomUUID(),
          code: "PAR-901",
          name: "TS Sub Program Two 1",
          description: `TS Sub Program Two linked to ${tsProgram.name}`,
          department: "Public Health",
          parentProgramName: tsProgram.name,
        },
      ]
    }
  )

  programRows = [...budgetUnits, ...normalizedTimeStudyPrograms, ...normalizedProgramActivityRelation]
}

seedInitialProgramsIfEmpty()

export function getMockProgramDepartments() {
  seedInitialProgramsIfEmpty()

  return Array.from(
    new Set(programRows.map((row) => row.department.trim()).filter((department) => department.length > 0))
  )
}

export function getMockProgramBudgetUnitNames() {
  seedInitialProgramsIfEmpty()

  return Array.from(
    new Set(
      programRows
        .filter((row) => row.tab === "Budget Units")
        .map((row) => row.name.trim())
        .filter((name) => name.length > 0)
    )
  )
}

export function getMockProgramBudgetUnitLookup() {
  seedInitialProgramsIfEmpty()

  const lookup: Record<string, { code: string; department: string }> = {}

  for (const row of programRows) {
    if (row.tab !== "Budget Units") continue
    const key = row.name.trim()
    if (!key) continue
    lookup[key] = {
      code: row.code.trim(),
      department: row.department.trim(),
    }
  }

  return lookup
}

export function getMockProgramBudgetProgramNames() {
  seedInitialProgramsIfEmpty()

  return Array.from(
    new Set(
      programRows
        .filter((row) => row.tab === "Time Study programs")
        .map((row) => row.name.trim())
        .filter((name) => name.length > 0)
    )
  )
}

export function getMockProgramBudgetProgramLookup() {
  seedInitialProgramsIfEmpty()

  const lookup: Record<string, { code: string; department: string }> = {}

  for (const row of programRows) {
    if (row.tab !== "Time Study programs") continue
    const key = row.name.trim()
    if (!key) continue
    lookup[key] = {
      code: row.code.trim(),
      department: row.department.trim(),
    }
  }

  return lookup
}

/** Time Study program names for a department, sorted A–Z (for Program Activity Relation). */
export function getMockTimeStudyProgramNamesForDepartment(department: string) {
  seedInitialProgramsIfEmpty()
  const d = department.trim()
  if (!d) return []

  return programRows
    .filter((row) => row.tab === "Time Study programs" && row.department.trim() === d)
    .map((row) => row.name.trim())
    .filter((name) => name.length > 0)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
}

/** Sorted sample options for the activity-relation “sort” control. */
export function getMockProgramActivityRelationSortOptions() {
  seedInitialProgramsIfEmpty()
  const fromRows = programRows
    .filter((row) => row.tab === "Program Activity Relation")
    .map((row) => row.name.trim())
    .filter((name) => name.length > 0)

  const merged = Array.from(new Set([...fromRows, "Sample option A", "Sample option B"]))
  return merged.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
}

/** Budget unit name linked to a Time Study program (by program name). Used when editing PAR rows. */
export function getMockParentBudgetUnitNameForProgram(programName: string): string {
  seedInitialProgramsIfEmpty()
  const trimmed = programName.trim()
  if (!trimmed) return ""
  const row = programRows.find(
    (r) => r.tab === "Time Study programs" && r.name.trim() === trimmed
  )
  return row?.parentBudgetUnitName?.trim() ?? ""
}

export function getMockTimeStudyProgramByName(programName: string): ProgramRow | undefined {
  seedInitialProgramsIfEmpty()
  const trimmed = programName.trim()
  if (!trimmed) return undefined
  return programRows.find(
    (r) => r.tab === "Time Study programs" && r.name.trim() === trimmed
  )
}

function applyFilters(rows: ProgramRow[], params: GetProgramsParams) {
  const searchTerm = params.search.trim().toLowerCase()

  return rows.filter((row) => {
    if (row.tab !== params.tab) return false
    if (params.inactiveOnly && row.active) return false

    if (!searchTerm) return true
    return (
      row.code.toLowerCase().includes(searchTerm) ||
      row.name.toLowerCase().includes(searchTerm) ||
      row.description.toLowerCase().includes(searchTerm) ||
      row.department.toLowerCase().includes(searchTerm)
    )
  })
}

export async function getMockPrograms(
  params: GetProgramsParams
): Promise<ProgramListResponse> {
  await wait(MOCK_DELAY_MS)

  if (params.tab === "Budget Units") {
    const budgetUnits = applyFilters(programRows, params)
    const start = (params.page - 1) * params.pageSize
    const end = start + params.pageSize
    const pagedBudgetUnits = budgetUnits.slice(start, end)

    const allPrograms = programRows.filter((row) => row.tab === "Time Study programs")
    const allSubPrograms = programRows.filter((row) => row.tab === "Program Activity Relation")

    const items: ProgramRow[] = []
    for (const budgetUnit of pagedBudgetUnits) {
      items.push({ ...budgetUnit, hierarchyLevel: 0 })

      const linkedPrograms = allPrograms.filter(
        (program) => program.parentBudgetUnitName?.trim() === budgetUnit.name.trim()
      )

      for (const program of linkedPrograms) {
        items.push({
          ...program,
          hierarchyLevel: 1,
          parentId: budgetUnit.id,
        })

        const linkedSubPrograms = allSubPrograms.filter(
          (subProgram) => subProgram.parentProgramName?.trim() === program.name.trim()
        )

        for (const subProgram of linkedSubPrograms) {
          items.push({
            ...subProgram,
            hierarchyLevel: 2,
            parentId: program.id,
          })
        }
      }
    }

    return {
      items,
      totalItems: budgetUnits.length,
    }
  }

  if (params.tab === "Time Study programs") {
    const timeStudyPrograms = applyFilters(programRows, params)
    const start = (params.page - 1) * params.pageSize
    const end = start + params.pageSize
    const pagedPrograms = timeStudyPrograms.slice(start, end)
    const allSubPrograms = programRows.filter(
      (row) =>
        row.tab === "Program Activity Relation" &&
        (!params.inactiveOnly || row.active === false)
    )

    const items: ProgramRow[] = []
    for (const tsProgram of pagedPrograms) {
      items.push({ ...tsProgram, hierarchyLevel: 0 })

      const linkedSubPrograms = allSubPrograms.filter(
        (subProgram) => subProgram.parentProgramName?.trim() === tsProgram.name.trim()
      )

      for (const subProgram of linkedSubPrograms) {
        items.push({
          ...subProgram,
          hierarchyLevel: 1,
          parentId: tsProgram.id,
        })
      }
    }

    return {
      items,
      totalItems: timeStudyPrograms.length,
    }
  }

  const filtered = applyFilters(programRows, params)
  const start = (params.page - 1) * params.pageSize
  const end = start + params.pageSize

  return {
    items: filtered.slice(start, end),
    totalItems: filtered.length,
  }
}

export async function createMockProgram(
  input: CreateProgramInput
): Promise<ProgramRow> {
  await wait(MOCK_DELAY_MS)
  const row = toRow(input)
  programRows = [row, ...programRows]
  return row
}

export async function updateMockProgram(
  input: UpdateProgramInput
): Promise<ProgramRow> {
  await wait(MOCK_DELAY_MS)
  const idx = programRows.findIndex((row) => row.id === input.id)
  if (idx < 0) {
    throw new Error("Program row not found")
  }

  const existing = programRows[idx]
  const fields = getRowFieldsFromValues(input.values)
  const updated: ProgramRow = {
    ...existing,
    tab: input.tab as ProgramTab,
    code: fields.code,
    name: fields.name,
    medicalPct: fields.medicalPct,
    description: fields.description,
    department: fields.department,
    active: input.values.active,
    parentBudgetUnitName:
      input.values.formSection === "BU Program"
        ? input.values.buProgramBudgetUnitName.trim()
        : undefined,
    parentProgramName:
      input.values.formSection === "BU Sub-Program"
        ? input.values.buSubProgramBudgetUnitProgramName.trim()
        : undefined,
  }

  programRows = [...programRows.slice(0, idx), updated, ...programRows.slice(idx + 1)]
  return updated
}
