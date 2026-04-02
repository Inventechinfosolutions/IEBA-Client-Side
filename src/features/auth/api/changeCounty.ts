import { api } from "@/lib/api"
import type {
  ApiEnvelope,
  ChangeCountyBody,
  ChangeCountyResult,
} from "../types"

function throwIfEnvelopeFailed(res: ApiEnvelope, fallbackMessage: string): void {
  if (res.success === false) {
    throw new Error(res.message ?? fallbackMessage)
  }
  if (res.statusCode !== undefined && res.statusCode !== null) {
    const code = Number(res.statusCode)
    if (Number.isFinite(code) && code !== 0) {
      throw new Error(res.message ?? fallbackMessage)
    }
  }
}

export async function changeCounty(body: ChangeCountyBody): Promise<ChangeCountyResult> {
  // Backend controller: @Controller("users") + @Post("change-county")
  // Global prefix (e.g. /api/v1) is handled by API_BASE_URL.
  const res = await api.post<ApiEnvelope>("/users/change-county", body)

  throwIfEnvelopeFailed(res, "Failed to change county")

  const payload = res.data ?? {}
  const accessToken =
    (payload.accessToken ??
      payload.access_token ??
      payload.token) as string | undefined

  if (!accessToken || !accessToken.trim()) {
    throw new Error("Invalid change-county response: missing access token")
  }

  const namespaceRaw =
    (payload.namespace ??
      payload.nameSpace ??
      payload.name_space) as string | undefined
  const countyNameRaw =
    (payload.countyName ?? payload.county_name) as string | undefined

  return {
    accessToken,
    namespace: namespaceRaw?.trim() || undefined,
    countyName: countyNameRaw?.trim() || undefined,
  }
}

