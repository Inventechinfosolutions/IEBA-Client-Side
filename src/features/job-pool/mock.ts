import type {
  CreateJobPoolInput,
  GetJobPoolsParams,
  JobPoolListResponse,
  JobPoolRow,
  UpdateJobPoolInput,
} from "./types"

export const DEPARTMENTS = [
  "Social Services",
  "Health",
  "Public Health",
  "Behavioral Health",
  "Administration",
  "IT",
  "Emergency Services",
  "Public Works",
  "Education",
]

const JOB_CLASSES = [
  { id: "jc-101", name: "Social Worker I" },
  { id: "jc-102", name: "Social Worker II" },
  { id: "jc-103", name: "Registered Nurse" },
  { id: "jc-104", name: "Eligibility Specialist" },
  { id: "jc-105", name: "Admin Assistant" },
  { id: "jc-106", name: "Program Manager" },
  { id: "jc-107", name: "Case Worker" },
  { id: "jc-108", name: "Nurse Practitioner" },
  { id: "jc-109", name: "Maintenance Lead" },
  { id: "jc-110", name: "IT Specialist" },
  { id: "jc-111", name: "Accountant" },
  { id: "jc-112", name: "Public Health Officer" },
]

let mockData: JobPoolRow[] = Array.from({ length: 30 }).map((_, i) => {
  const id = i + 1
  const dept = DEPARTMENTS[i % DEPARTMENTS.length]
  
  // Pick 6-8 job classifications
  const numClasses = 6 + (i % 3) // 6, 7, 8
  const startIdx = i % (JOB_CLASSES.length - 8)
  const jobClassifications = JOB_CLASSES.slice(startIdx, startIdx + numClasses)

  return {
    id: String(id),
    name: `Job Pool ${String(id).padStart(3, "0")} - ${dept}`,
    department: dept,
    active: i % 5 !== 0, // Roughly 80% active
    jobClassifications,
    assignedActivityIds: [],
    assignedEmployeeIds: [],
  }
})

let nextId = 131

function delay(ms = 300) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export async function getMockJobPools(
  params: GetJobPoolsParams,
): Promise<JobPoolListResponse> {
  await delay()

  const { page, pageSize, search, inactiveOnly } = params

  let filtered = mockData

  if (search.trim()) {
    const lower = search.toLowerCase()
    filtered = filtered.filter(
      (row) =>
        row.name.toLowerCase().includes(lower) ||
        row.department.toLowerCase().includes(lower) ||
        row.jobClassifications.some((c) => c.name.toLowerCase().includes(lower)),
    )
  }

  if (inactiveOnly) {
    filtered = filtered.filter((row) => !row.active)
  }

  const totalItems = filtered.length
  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return { items, totalItems }
}

export async function createMockJobPool(
  input: CreateJobPoolInput,
): Promise<JobPoolRow> {
  await delay()
  
  const newRow: JobPoolRow = {
    id: String(nextId++),
    name: input.values.name.trim(),
    jobClassifications: input.values.assignedJobClassificationIds.map(id => ({ id, name: id.replace("jc-", "Class ") })),
    department: input.values.department.trim(),
    active: input.values.active,
    assignedActivityIds: input.values.assignedActivityIds,
    assignedEmployeeIds: input.values.assignedEmployeeIds,
  }
  mockData = [newRow, ...mockData]
  return newRow
}

export async function updateMockJobPool(
  input: UpdateJobPoolInput,
): Promise<JobPoolRow> {
  await delay()
  
  mockData = mockData.map((row) =>
    row.id === input.id
      ? {
          ...row,
          name: input.values.name.trim(),
          department: input.values.department.trim(),
          active: input.values.active,
          jobClassifications: input.values.assignedJobClassificationIds.map(id => ({ id, name: id.replace("jc-", "Class ") })),
          assignedActivityIds: input.values.assignedActivityIds,
          assignedEmployeeIds: input.values.assignedEmployeeIds,
        }
      : row,
  )
  return mockData.find((r) => r.id === input.id)!
}
