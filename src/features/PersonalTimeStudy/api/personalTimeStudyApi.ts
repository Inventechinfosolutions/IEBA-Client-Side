import { api } from "@/lib/api"
import type { ApiEnvelope } from "@/features/program/types"
import type { 
  SubmitNotesReqDto, 
  TimeStudyRecordResDto, 
  TimeStudyRecordSubmitItemDto, 
  UserDayLegendDetailResDto, 
  UserMonthLegendResDto 
} from "../types"
import type { EmployeeLeaveRequestFormValues } from "../schema/PersonalTimeStudySchema"
import type { UserLeave } from "../../leave-approval/types"
import { apiSubmitBulkUserLeaves, apiUpdateUserLeave as apiUpdateUserLeaveBase } from "../../leave-approval/api"

export async function apiGetMonthLegend(params: {
  userId: string
  month: number
  year: number
}): Promise<UserMonthLegendResDto> {
  const res = await api.get<ApiEnvelope<UserMonthLegendResDto>>(
    `/timestudyrecords/user/monthlegend?userId=${params.userId}&month=${params.month}&year=${params.year}`
  )
  return res.data!
}

export async function apiGetDayDetail(params: {
  userId: string
  date: string // YYYY-MM-DD
  month: number
  year: number
}): Promise<UserDayLegendDetailResDto> {
  const { date, userId, month, year } = params
  const res = await api.get<ApiEnvelope<UserDayLegendDetailResDto>>(
    `/timestudyrecords/user/daydetail?date=${date}&userId=${userId}&month=${month}&year=${year}`
  )
  return res.data!
}

/** Saves notes for a specific date. */
export async function apiSaveNotes(dto: SubmitNotesReqDto): Promise<void> {
  await api.post("/timestudyrecords/user/notes/day/save", dto)
}

/** Bulk saves or submits time study records. */
export async function apiSubmitTimeRecords(
  payload: TimeStudyRecordSubmitItemDto[],
  mode: "save" | "submit"
): Promise<TimeStudyRecordResDto[]> {
  const res = await api.post<ApiEnvelope<TimeStudyRecordResDto[]>>(
    `/timestudyrecords/submit?mode=${mode}`,
    payload
  )
  return res.data!
}

/** Uploads a supporting document for a record. */
export async function apiUploadSupportingDoc(
  recordId: number,
  file: File
): Promise<void> {
  const formData = new FormData()
  formData.append("file", file)
  await api.post(`/timestudyrecords/${recordId}/supporting-doc`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
}
/** Fetches programs and activities for the current user's dropdowns. */
export async function apiGetUserProgramsAndActivities(userId: string): Promise<any> {
  const res = await api.get<ApiEnvelope<any>>(`/timestudyprograms/user/programs-activities?userId=${userId}`)
  return res.data!
}

/** Updates a single time study record by ID. */
export async function apiUpdateTimeRecord(
  id: number,
  dto: Partial<TimeStudyRecordSubmitItemDto>
): Promise<TimeStudyRecordResDto> {
  const res = await api.put<ApiEnvelope<TimeStudyRecordResDto>>(
    `/timestudyrecords/${id}`,
    dto
  )
  return res.data!
}

/** Deletes a single time study record by ID. */
export async function apiDeleteTimeRecord(id: number): Promise<void> {
  await api.delete(`/timestudyrecords/${id}`)
}

/** Builds leave request records from form values and dropdown data. */
function buildLeaveRecords(
  values: EmployeeLeaveRequestFormValues,
  userId: string,
  dropdownData: any[] | undefined,
  status: "draft" | "requested" | "approved",
) {
  const allPrograms = dropdownData?.flatMap((d: any) => d.programs) ?? []
  const allActivities = dropdownData?.flatMap((d: any) => d.activities) ?? []

  return values.entries.map((entry) => {
    const program = allPrograms.find((p: any) => String(p.id) === entry.programCode) as any
    const activity = allActivities.find((a: any) => String(a.id) === entry.activityCode) as any

    return {
      userId,
      programid: entry.programCode,
      activityid: entry.activityCode,
      programcode: program?.code ?? entry.programCode,
      programname: program?.name ?? entry.programCode,
      activitycode: activity?.code ?? entry.activityCode,
      activityname: activity?.name ?? entry.activityCode,
      startdt: entry.date,
      enddt: entry.date,
      starttime: entry.startTime,
      endtime: entry.endTime,
      leaveTotalTime: parseInt(entry.totalMinApplied, 10) || 0,
      requestcomment: entry.comment || undefined,
      status: status as any,
    }
  })
}

/** Save leave entries as draft (no supervisor notification). */
export async function apiSaveLeaveAsDraft(
  values: EmployeeLeaveRequestFormValues,
  userId: string,
  dropdownData?: any[],
): Promise<UserLeave[]> {
  return apiSubmitBulkUserLeaves(buildLeaveRecords(values, userId, dropdownData, "draft"))
}

/** Submit leave entries as requested (notifies supervisor). */
export async function apiSubmitLeaveAsRequested(
  values: EmployeeLeaveRequestFormValues,
  userId: string,
  dropdownData?: any[],
): Promise<UserLeave[]> {
  return apiSubmitBulkUserLeaves(buildLeaveRecords(values, userId, dropdownData, "requested"))
}

/** Withdraw a leave request. */
export async function apiWithdrawLeave(leave: any): Promise<void> {
  const payload = {
    userId: leave.userId,
    programid: String(leave.programid),
    activityid: String(leave.activityid),
    programcode: leave.programcode,
    programname: leave.programname,
    activitycode: leave.activitycode,
    activityname: leave.activityname,
    startdt: leave.startdt,
    enddt: leave.enddt,
    starttime: leave.starttime,
    endtime: leave.endtime,
    leaveTotalTime: Number(leave.leaveTotalTime),
    requestcomment: leave.requestcomment,
    status: "withdraw",
  }
  await api.put(`/usersleave/${leave.id}`, payload)
}

/** Get a leave request by ID. */
export async function apiGetUserLeaveById(id: number): Promise<any> {
  const envelope = await api.get<{ data: any }>(`/usersleave/${id}`)
  return envelope.data
}

/** Update an existing leave request. */
export async function apiUpdateUserLeave(id: number, values: EmployeeLeaveRequestFormValues, userId: string, status: "draft" | "requested" | "approved", dropdownData?: any[]): Promise<UserLeave> {
  const records = buildLeaveRecords(values, userId, dropdownData, status)
  if (records.length === 0) throw new Error("No records to update")
  return apiUpdateUserLeaveBase(id, records[0] as any)
}

/** Fetches time entry summary (TS mins, MAA mins, balances) for a specific date. */
export async function apiGetTimeEntrySummary(userId: string, date: string): Promise<any> {
  const res = await api.get<ApiEnvelope<any>>(`/timestudyrecords/user/timeentry/record?userId=${userId}&date=${date}`)
  return res.data
}
