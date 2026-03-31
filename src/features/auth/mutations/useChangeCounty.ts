import { useMutation } from "@tanstack/react-query"

import {
  changeCounty,
  type ChangeCountyBody,
  type ChangeCountyResult,
} from "../api/changeCounty"
import { authKeys } from "../keys"

export function useChangeCounty() {
  return useMutation<ChangeCountyResult, Error, ChangeCountyBody>({
    mutationKey: authKeys.changeCounty(),
    mutationFn: changeCounty,
  })
}

