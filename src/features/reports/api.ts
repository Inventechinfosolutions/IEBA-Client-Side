import { delay, mockReportOptions, MOCK_NETWORK_DELAY_MS } from "@/features/settings/mock"
import { getToken } from "@/lib/api"
import { API_BASE_URL } from "@/lib/config"

import type { ReportCatalogItem, ReportRunPayload } from "./types"

type PostReportBlobOptions = {
  signal?: AbortSignal
}

export async function apiGetReportCatalog(): Promise<ReportCatalogItem[]> {
  await delay(MOCK_NETWORK_DELAY_MS)
  return mockReportOptions.map((r) => ({ key: r.key, label: r.label }))
}

async function postReportBlob(
  path: string,
  body: ReportRunPayload,
  options?: PostReportBlobOptions,
): Promise<Blob> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: options?.signal,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const rawMessage =
      (errorBody as { message?: string | string[] }).message ??
      (errorBody as { error?: string }).error
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : (rawMessage ?? response.statusText)
    throw new Error(message)
  }

  return response.blob()
}

export async function apiPostViewReport(
  body: ReportRunPayload,
  options?: PostReportBlobOptions,
): Promise<Blob> {
  return postReportBlob("/reports/view", body, options)
}

export async function apiPostDownloadReport(
  body: ReportRunPayload,
  options?: PostReportBlobOptions,
): Promise<Blob> {
  return postReportBlob("/reports/download", body, options)
}
