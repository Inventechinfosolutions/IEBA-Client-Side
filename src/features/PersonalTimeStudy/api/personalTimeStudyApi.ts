import { api } from "@/lib/api"
import type { ApiEnvelope } from "@/features/program/types"
import type { 
  SubmitNotesReqDto, 
  TimeStudyRecordResDto, 
  TimeStudyRecordSubmitItemDto, 
  UserDayLegendDetailResDto, 
  UserMonthLegendResDto 
} from "../types"

export async function apiGetMonthLegend(params: {
  userId: string
  month: number
  year: number
}): Promise<UserMonthLegendResDto> {
  const res = await api.post<ApiEnvelope<UserMonthLegendResDto>>("/timestudyrecords/user/monthlegend", params)
  return res.data!
}

export async function apiGetDayDetail(params: {
  userId: string
  date: string // YYYY-MM-DD
  month: number
  year: number
}): Promise<UserDayLegendDetailResDto> {
  const { date, ...body } = params
  const res = await api.post<ApiEnvelope<UserDayLegendDetailResDto>>(
    `/timestudyrecords/user/daydetail?date=${date}`,
    body
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
