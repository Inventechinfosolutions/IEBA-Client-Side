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
  screen?: string
}): Promise<UserMonthLegendResDto> {
  const { userId, month, year, screen } = params
  const screenParam = screen ? `&screen=${encodeURIComponent(screen)}` : ""
  const res = await api.get<ApiEnvelope<UserMonthLegendResDto>>(
    `/timestudyrecords/user/monthlegend?userId=${userId}&month=${month}&year=${year}${screenParam}`
  )
  return res.data!
}

export async function apiGetDayDetail(params: {
  userId: string
  date: string // YYYY-MM-DD
  month: number
  year: number
  screen?: string
}): Promise<UserDayLegendDetailResDto> {
  const { date, userId, month, year, screen } = params
  const screenParam = screen ? `&screen=${encodeURIComponent(screen)}` : ""
  const res = await api.get<ApiEnvelope<UserDayLegendDetailResDto>>(
    `/timestudyrecords/user/daydetail?date=${date}&userId=${userId}&month=${month}&year=${year}${screenParam}`
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
  mode: "save" | "submit",
  method: "post" | "put" = "post"
): Promise<TimeStudyRecordResDto[]> {
  const strippedPayload = payload.map(({ supportingDocs, ...rest }: any) => rest)
  const url = `/timestudyrecords/submit?mode=${mode}`
  const res = method === "put" 
    ? await api.put<ApiEnvelope<TimeStudyRecordResDto[]>>(url, strippedPayload)
    : await api.post<ApiEnvelope<TimeStudyRecordResDto[]>>(url, strippedPayload)
  return res.data!
}

/** Uploads a supporting document for a record. */
export async function apiUploadSupportingDoc(
  recordId: number,
  file: File
): Promise<void> {
  const formData = new FormData()
  formData.append("file", file)
  await api.post(`/timestudyrecords/${recordId}/supporting-doc`, formData)
}
/** Downloads a supporting document for a record by optional docId. Returns a Blob. */
export async function apiDownloadSupportingDoc(recordId: number, docId?: number): Promise<Blob> {
  const url = docId
    ? `/timestudyrecords/${recordId}/supporting-doc?docId=${docId}`
    : `/timestudyrecords/${recordId}/supporting-doc`
  return api.get<Blob>(url)
}
/** Deletes a specific supporting document by docId, or all docs if docId omitted. */
export async function apiDeleteSupportingDoc(recordId: number, docId?: number): Promise<void> {
  const url = docId
    ? `/timestudyrecords/${recordId}/supporting-doc?docId=${docId}`
    : `/timestudyrecords/${recordId}/supporting-doc`
  await api.delete(url)
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
  const { supportingDocs, ...rest } = dto as any
  const res = await api.put<ApiEnvelope<TimeStudyRecordResDto>>(
    `/timestudyrecords/${id}`,
    rest
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

    const normalizeTime = (t: string) => {
      if (!t) return "00:00:00"
      if (t.length === 5) return `${t}:00`
      return t
    }

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
      starttime: normalizeTime(entry.startTime),
      endtime: normalizeTime(entry.endTime),
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
export async function apiGetTimeEntrySummary(userId: string, date: string, screen?: string): Promise<any> {
  const screenParam = screen ? `&screen=${encodeURIComponent(screen)}` : ""
  const res = await api.get<ApiEnvelope<any>>(`/timestudyrecords/user/timeentry/record?userId=${userId}&date=${date}${screenParam}`)
  return res.data
}
