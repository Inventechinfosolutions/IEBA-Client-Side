import { useQuery } from "@tanstack/react-query"
import { scheduleTimeStudyKeys } from "../keys"
import type {
  ParticipantsListRow,
  ScheduledTimeStudyRow,
  ScheduleTimeStudyPeriodRow,
} from "../types"

const MOCK_PERIOD_ROWS: ScheduleTimeStudyPeriodRow[] = [
  {
    id: "stsp-1",
    timeStudyPeriod: "hijk",
    startDate: "04-01-2026",
    endDate: "05-01-2026",
    hours: 184,
    holidays: 0,
    allocable: 184,
    nonAllocable: 0,
  },
  {
    id: "stsp-2",
    timeStudyPeriod: "SS FY25-26 I TS 3",
    startDate: "01-25-2026",
    endDate: "02-21-2026",
    hours: 160,
    holidays: 1,
    allocable: 152,
    nonAllocable: 8,
  },
  {
    id: "stsp-3",
    timeStudyPeriod: "SS FY25-26 I TS 2",
    startDate: "10-19-2025",
    endDate: "11-15-2025",
    hours: 160,
    holidays: 1,
    allocable: 152,
    nonAllocable: 8,
  },
]

const MOCK_PARTICIPANTS_LIST_ROWS: ParticipantsListRow[] = [
  {
    id: "participant-1",
    groupName: "gggyy",
    jobPool: false,
    costPool: false,
    user: true,
    canView: true,
  },
  {
    id: "participant-2",
    groupName: "ssssssssssssssssssssss",
    jobPool: false,
    costPool: false,
    user: true,
  },
]

const MOCK_SCHEDULED_TIME_STUDY_ROWS: ScheduledTimeStudyRow[] = [
  {
    id: "scheduled-1",
    timeStudyPeriod: "SS FY25-26 I TS 2",
    startDate: "10-19-2025",
    endDate: "11-15-2025",
    groups: "SS,",
    status: "published",
  },
  {
    id: "scheduled-2",
    timeStudyPeriod: "SS FY25-26 I TS 3",
    startDate: "01-25-2026",
    endDate: "02-21-2026",
    groups: "SS | Test Group 1,",
    status: "published",
  },
]

async function fetchScheduleTimeStudyPeriods(
  department: string
): Promise<ScheduleTimeStudyPeriodRow[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  void department
  return MOCK_PERIOD_ROWS
}

async function fetchParticipantsListRows(): Promise<ParticipantsListRow[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return MOCK_PARTICIPANTS_LIST_ROWS
}

async function fetchScheduledTimeStudyRows(): Promise<ScheduledTimeStudyRow[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return MOCK_SCHEDULED_TIME_STUDY_ROWS
}

export function useGetScheduleTimeStudyPeriods(department: string) {
  const trimmed = department.trim()
  return useQuery({
    queryKey: scheduleTimeStudyKeys.list({ department: trimmed }),
    queryFn: () => fetchScheduleTimeStudyPeriods(trimmed),
    enabled: trimmed.length > 0,
  })
}

export function useGetParticipantsListRows() {
  return useQuery({
    queryKey: scheduleTimeStudyKeys.participants(),
    queryFn: fetchParticipantsListRows,
  })
}

export function useGetScheduledTimeStudyRows() {
  return useQuery({
    queryKey: scheduleTimeStudyKeys.scheduled(),
    queryFn: fetchScheduledTimeStudyRows,
  })
}
