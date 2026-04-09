import { useQuery } from "@tanstack/react-query"

import { fetchRmtsGroups } from "../api/api"
import { scheduleTimeStudyKeys } from "../keys"
import { mapGroupToParticipantRow } from "../utils/rmtsMappers"
import type {
  GetRmtsGroupsQueryParams,
  ParticipantsListRow,
  RmtsGroupApiDto,
} from "../types"

export function useGetRmtsGroups(params: GetRmtsGroupsQueryParams) {
  const departmentId = params.departmentId
  const fiscalyear = params.fiscalyear.trim()

  return useQuery({
    queryKey: scheduleTimeStudyKeys.groupList({
      departmentId: departmentId ?? 0,
      fiscalyear,
    }),
    queryFn: async (): Promise<{ rows: ParticipantsListRow[]; raw: RmtsGroupApiDto[] }> => {
      if (departmentId == null || departmentId <= 0) {
        return { rows: [], raw: [] }
      }
      const list = await fetchRmtsGroups({ fiscalyear, departmentId })
      return {
        raw: list,
        rows: list.map((dto) => mapGroupToParticipantRow(dto)),
      }
    },
    enabled: departmentId != null && departmentId > 0 && fiscalyear.length > 0,
  })
}
