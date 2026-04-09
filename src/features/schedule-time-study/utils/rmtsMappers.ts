import { RmtsGroupType } from "../enums/schedule-time-study.enum"
import type { RmtsGroupTypeValue } from "../enums/schedule-time-study.enum"
import type {
  ParticipantsListRow,
  RmtsGroupApiDto,
  RmtsPayPeriodApiDto,
  RmtsPpGroupListEnrichedApiDto,
  ScheduledTimeStudyRow,
  ScheduledTimeStudyRowEnriched,
  ScheduleTimeStudyPeriodRow,
} from "../types"
import { normalizeDateInputValue } from "./dates"

function resolveRmtsPayPeriodIsUsed(dto: RmtsPayPeriodApiDto): boolean {
  return dto.isUsed === true || dto.is_used === true
}

export function mapPayPeriodToRow(dto: RmtsPayPeriodApiDto): ScheduleTimeStudyPeriodRow {
  return {
    id: String(dto.id),
    timeStudyPeriod: dto.name,
    startDate: normalizeDateInputValue(dto.startdt),
    endDate: normalizeDateInputValue(dto.enddt),
    hours: dto.hours,
    holidays: dto.holidayhours ?? 0,
    allocable: dto.allocatetime,
    nonAllocable: dto.nonallocatetime,
    isUsed: resolveRmtsPayPeriodIsUsed(dto),
  }
}

function mapApiGrouptypeToValue(raw: string): RmtsGroupTypeValue {
  const gt = raw.trim().toLowerCase()
  if (gt === RmtsGroupType.JobPool.toLowerCase()) return RmtsGroupType.JobPool
  if (gt === RmtsGroupType.CostPool.toLowerCase()) return RmtsGroupType.CostPool
  if (gt === RmtsGroupType.User.toLowerCase()) return RmtsGroupType.User
  return RmtsGroupType.User
}

function resolveRmtsGroupIsUsed(dto: RmtsGroupApiDto): boolean {
  return dto.isUsed === true || dto.is_used === true
}

/**
 * Group ids tied to Scheduled Time Study via `GET /rmtsppgrouplist` (enriched rows).
 * Uses `groupIds` CSV and nested `groups[].id`.
 */
export function collectGroupIdsFromEnrichedPpGroupList(
  items: RmtsPpGroupListEnrichedApiDto[],
): Set<number> {
  const ids = new Set<number>()
  for (const item of items) {
    const csv = (item.groupIds ?? "").trim()
    if (csv.length > 0) {
      for (const part of csv.split(/[,\s]+/)) {
        const t = part.trim()
        if (!t) continue
        const n = Number(t)
        if (Number.isFinite(n) && n > 0) ids.add(n)
      }
    }
    for (const g of item.groups ?? []) {
      const n = g.id
      if (Number.isFinite(n) && n > 0) ids.add(n)
    }
  }
  return ids
}

/**
 * @param assignedInSchedule — true when this group id appears on `rmtsppgrouplist` for the same dept/fiscal year.
 */
export function mapGroupToParticipantRow(
  dto: RmtsGroupApiDto,
  assignedInSchedule = false,
): ParticipantsListRow {
  const grouptype = mapApiGrouptypeToValue(dto.grouptype)
  const gt = grouptype.toLowerCase()
  return {
    id: String(dto.id),
    groupName: dto.name,
    grouptype,
    jobPool: gt === RmtsGroupType.JobPool.toLowerCase(),
    costPool: gt === RmtsGroupType.CostPool.toLowerCase(),
    user: gt === RmtsGroupType.User.toLowerCase(),
    isUsed: resolveRmtsGroupIsUsed(dto) || assignedInSchedule,
  }
}

function titleCaseStatus(s: string): string {
  if (!s) return ""
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export function mapEnrichedToScheduledRow(dto: RmtsPpGroupListEnrichedApiDto): ScheduledTimeStudyRow {
  const groupNames = dto.groups.map((g) => g.name).filter(Boolean)
  return {
    id: String(dto.id),
    timeStudyPeriod: dto.payPeriodName,
    startDate: normalizeDateInputValue(dto.payPeriodStartdt),
    endDate: normalizeDateInputValue(dto.payPeriodEnddt),
    groups: groupNames.join(", "),
    status: titleCaseStatus(dto.status),
  }
}

export function mapEnrichedToScheduledRowEnriched(
  dto: RmtsPpGroupListEnrichedApiDto,
): ScheduledTimeStudyRowEnriched {
  const base = mapEnrichedToScheduledRow(dto)
  return {
    ...base,
    ppId: dto.ppId,
    groupIds: dto.groupIds,
    statusRaw: dto.status,
  }
}
