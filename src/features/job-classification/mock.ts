import type {
  CreateJobClassificationInput,
  GetJobClassificationsParams,
  JobClassificationListResponse,
  JobClassificationRow,
  UpdateJobClassificationInput,
} from "./types"

let mockData: JobClassificationRow[] = [
  { id: "1",  code: "ASOC-AM-PM",  name: "Associate - AM/PM",              active: true  },
  { id: "2",  code: "ASOC-PCAP",   name: "Associate - PCAP",               active: true  },
  { id: "3",  code: "ASOC-WC",     name: "Associate - WC",                 active: true  },
  { id: "4",  code: "CLK-I",       name: "Clerk I",                        active: true  },
  { id: "5",  code: "CLK-II",      name: "Clerk II",                       active: true  },
  { id: "6",  code: "CLK-III",     name: "Clerk III",                      active: true  },
  { id: "7",  code: "DIR",         name: "Director",                       active: true  },
  { id: "8",  code: "HLTH-TCH",    name: "Health Technician",              active: true  },
  { id: "9",  code: "HLTH-MGR",    name: "Health Services Manager",        active: true  },
  { id: "10", code: "LVN",         name: "Licensed Vocational Nurse",      active: true  },
  { id: "11", code: "MGR-I",       name: "Manager I",                      active: true  },
  { id: "12", code: "MGR-II",      name: "Manager II",                     active: true  },
  { id: "13", code: "MGR-III",     name: "Manager III",                    active: true  },
  { id: "14", code: "NURSE-RN",    name: "Nurse - Registered Nurse",       active: true  },
  { id: "15", code: "PHARM",       name: "Pharmacist",                     active: true  },
  { id: "16", code: "PHYS-ASST",   name: "Physician Assistant",            active: true  },
  { id: "17", code: "PROG-ANA",    name: "Program Analyst",                active: true  },
  { id: "18", code: "PROG-ANA-SR", name: "Program Analyst Senior",         active: true  },
  { id: "19", code: "PROG-SPEC",   name: "Program Specialist",             active: true  },
  { id: "20", code: "PSY",         name: "Psychologist",                   active: true  },
  { id: "21", code: "PSY-TECH",    name: "Psychology Technician",          active: true  },
  { id: "22", code: "PUB-HLTH",    name: "Public Health Nurse",            active: true  },
  { id: "23", code: "REC-SPEC",    name: "Recreation Specialist",          active: true  },
  { id: "24", code: "SOC-WRK-I",   name: "Social Worker I",               active: true  },
  { id: "25", code: "SOC-WRK-II",  name: "Social Worker II",              active: true  },
  { id: "26", code: "SOC-WRK-III", name: "Social Worker III",             active: true  },
  { id: "27", code: "SPVSR-I",     name: "Supervisor I",                   active: true  },
  { id: "28", code: "SPVSR-II",    name: "Supervisor II",                  active: true  },
  { id: "29", code: "SUPP-SPVSR",  name: "Support Supervisor",             active: false },
  { id: "30", code: "SW-AID",      name: "Social Worker Aide",             active: false },
  { id: "31", code: "TEMP",        name: "Temporary",                      active: false },
  { id: "32", code: "VOL",         name: "Volunteer",                      active: false },
]

let nextId = 33

function delay(ms = 300) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export async function getMockJobClassifications(
  params: GetJobClassificationsParams,
): Promise<JobClassificationListResponse> {
  await delay()

  const { page, pageSize, search, inactiveOnly } = params

  let filtered = mockData

  if (search.trim()) {
    const lower = search.toLowerCase()
    filtered = filtered.filter(
      (row) =>
        row.code.toLowerCase().includes(lower) ||
        row.name.toLowerCase().includes(lower),
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

export async function createMockJobClassification(
  input: CreateJobClassificationInput,
): Promise<JobClassificationRow> {
  await delay()
  const newRow: JobClassificationRow = {
    id: String(nextId++),
    code: input.values.code.trim(),
    name: input.values.name.trim(),
    active: input.values.active,
  }
  mockData = [newRow, ...mockData]
  return newRow
}

export async function updateMockJobClassification(
  input: UpdateJobClassificationInput,
): Promise<JobClassificationRow> {
  await delay()
  mockData = mockData.map((row) =>
    row.id === input.id
      ? {
          ...row,
          code: input.values.code.trim(),
          name: input.values.name.trim(),
          active: input.values.active,
        }
      : row,
  )
  return mockData.find((r) => r.id === input.id)!
}
