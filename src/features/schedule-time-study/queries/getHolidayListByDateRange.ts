import type {
  GetScheduleTimeStudyHolidayListByDateRangeParams,
  HolidayCalendarApiDto,
} from "../types"
import { fetchHolidayListByDateRange } from "../api/api"

export async function fetchScheduleTimeStudyHolidayListByDateRange(
  params: GetScheduleTimeStudyHolidayListByDateRangeParams,
): Promise<HolidayCalendarApiDto[]> {
  return fetchHolidayListByDateRange(params.startmonth, params.endmonth)
}

