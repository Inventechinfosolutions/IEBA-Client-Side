/** Mirrors backend `ReportMasterCodeDataDto` / `reportdata` JSON buckets. */

export type ReportMasterCodeData = {
  masterCodeIds: number[]
  masterCodeNames?: string[]
  activityCodes: string[]
}

export type ReportMasterCodeDataInput = {
  masterCodeIds?: number[]
  activityCodes?: string[]
}

export function emptyReportMasterCodeData(): ReportMasterCodeData {
  return { masterCodeIds: [], activityCodes: [] }
}

function normalizeIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n >= 1))]
}

function normalizeActivityCodes(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((v) => String(v).trim()).filter(Boolean))]
}

function parseMaybeJsonValue(raw: unknown): unknown {
  if (typeof raw !== "string") return raw
  const trimmed = raw.trim()
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return raw
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return raw
  }
}

function parseBucket(raw: unknown): ReportMasterCodeData {
  const parsed = parseMaybeJsonValue(raw)
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    if (Array.isArray(parsed)) {
      return { masterCodeIds: [], activityCodes: normalizeActivityCodes(parsed) }
    }
    return emptyReportMasterCodeData()
  }
  const obj = parsed as Record<string, unknown>
  return {
    masterCodeIds: normalizeIds(obj.masterCodeIds ?? obj.masterCodeId),
    masterCodeNames: Array.isArray(obj.masterCodeNames)
      ? obj.masterCodeNames.map((n) => String(n).trim()).filter(Boolean)
      : undefined,
    activityCodes: normalizeActivityCodes(obj.activityCodes ?? obj.ActivityCodes ?? obj.codes),
  }
}

/** Parse API report row into excluded / included buckets (falls back to legacy CSV by `type`). */
export function parseReportMasterCodeDataFromRow(
  row: Record<string, unknown>,
): { excluded: ReportMasterCodeData; included: ReportMasterCodeData } {
  const excludedField =
    row.excludedMasterCodeData ?? row.excluded_master_code_data ?? row.excludedMasterCodes
  const includedField =
    row.includedMasterCodeData ?? row.included_master_code_data ?? row.includedMasterCodes
  if (excludedField != null || includedField != null) {
    return {
      excluded: parseBucket(excludedField),
      included: parseBucket(includedField),
    }
  }

  const reportType = String(row.type ?? "excluded").toLowerCase()
  const rawReportdata = row.reportdata == null ? null : String(row.reportdata)
  const legacyCodes =
    rawReportdata && !rawReportdata.trim().startsWith("{")
      ? rawReportdata
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : []

  if (reportType === "included") {
    return {
      excluded: emptyReportMasterCodeData(),
      included: { masterCodeIds: [], activityCodes: legacyCodes },
    }
  }
  return {
    excluded: { masterCodeIds: [], activityCodes: legacyCodes },
    included: emptyReportMasterCodeData(),
  }
}

export function complementMasterCodeIdStrings(
  allCatalogIds: number[],
  selectedIds: string[],
): string[] {
  const selected = new Set(
    selectedIds.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n >= 1),
  )
  return allCatalogIds.filter((id) => !selected.has(id)).map(String)
}

export function complementActivityCodeStrings(
  allCatalogCodes: string[],
  selectedCodes: string[],
): string[] {
  const catalog = [...new Set(allCatalogCodes.map((c) => c.trim()).filter(Boolean))]
  const selected = new Set(selectedCodes.map((c) => c.trim()).filter(Boolean))
  return catalog.filter((code) => !selected.has(code))
}

/**
 * User picks one bucket; the other bucket is auto-filled (master codes + activities).
 */
export function applyReportBucketsComplementForSave(
  allCatalogIds: number[],
  allActivityCodes: string[],
  masterCodeExclusionMode: "exclude" | "include",
  activityExclusionMode: "exclude" | "include",
  excludedMasterCodeIds: string[],
  excludedActivityCodes: string[],
  includedMasterCodeIds: string[],
  includedActivityCodes: string[],
): {
  excludedMasterCodeData: ReportMasterCodeDataInput
  includedMasterCodeData: ReportMasterCodeDataInput
  excludedMasterCodeIds: string[]
  includedMasterCodeIds: string[]
  excludedActivityCodes: string[]
  includedActivityCodes: string[]
} {
  const catalog = [...new Set(allCatalogIds)].filter((n) => n >= 1)
  const activityCatalog = [...new Set(allActivityCodes.map((c) => c.trim()).filter(Boolean))]

  let finalExcludedIds = excludedMasterCodeIds
  let finalIncludedIds = includedMasterCodeIds
  let finalExcludedActs = excludedActivityCodes
  let finalIncludedActs = includedActivityCodes

  if (masterCodeExclusionMode === "include") {
    finalIncludedIds = includedMasterCodeIds
    finalExcludedIds = complementMasterCodeIdStrings(catalog, finalIncludedIds)
  } else {
    finalExcludedIds = excludedMasterCodeIds
    finalIncludedIds = complementMasterCodeIdStrings(catalog, finalExcludedIds)
  }

  if (activityExclusionMode === "include") {
    finalIncludedActs = includedActivityCodes
    finalExcludedActs = complementActivityCodeStrings(activityCatalog, finalIncludedActs)
  } else {
    finalExcludedActs = excludedActivityCodes
    finalIncludedActs = complementActivityCodeStrings(activityCatalog, finalExcludedActs)
  }

  const payload = buildReportMasterCodeSavePayload(
    finalExcludedIds,
    finalExcludedActs,
    finalIncludedIds,
    finalIncludedActs,
  )

  return {
    ...payload,
    excludedMasterCodeIds: finalExcludedIds,
    includedMasterCodeIds: finalIncludedIds,
    excludedActivityCodes: finalExcludedActs,
    includedActivityCodes: finalIncludedActs,
  }
}

/** @deprecated Use applyReportBucketsComplementForSave */
export const applyMasterCodeComplementForSave = applyReportBucketsComplementForSave

/**
 * When the API returns only the user-selected bucket, fill the complementary bucket
 * from the master-code / activity catalogs (same rules as save).
 */
export function hydrateReportBucketComplements(
  excluded: ReportMasterCodeData,
  included: ReportMasterCodeData,
  catalogMasterCodeIds: number[],
  catalogActivityCodes: string[],
): { excluded: ReportMasterCodeData; included: ReportMasterCodeData } {
  const ex = { ...excluded, masterCodeIds: [...excluded.masterCodeIds], activityCodes: [...excluded.activityCodes] }
  const inc = { ...included, masterCodeIds: [...included.masterCodeIds], activityCodes: [...included.activityCodes] }
  const catalog = [...new Set(catalogMasterCodeIds)].filter((n) => n >= 1)

  if (catalog.length > 0) {
    if (ex.masterCodeIds.length === 0 && inc.masterCodeIds.length > 0) {
      ex.masterCodeIds = catalog.filter((id) => !inc.masterCodeIds.includes(id))
    } else if (inc.masterCodeIds.length === 0 && ex.masterCodeIds.length > 0) {
      inc.masterCodeIds = catalog.filter((id) => !ex.masterCodeIds.includes(id))
    }
  }

  const actCatalog = [...new Set(catalogActivityCodes.map((c) => c.trim()).filter(Boolean))]
  if (actCatalog.length > 0) {
    if (ex.activityCodes.length === 0 && inc.activityCodes.length > 0) {
      ex.activityCodes = complementActivityCodeStrings(actCatalog, inc.activityCodes)
    } else if (inc.activityCodes.length === 0 && ex.activityCodes.length > 0) {
      inc.activityCodes = complementActivityCodeStrings(actCatalog, ex.activityCodes)
    }
  }

  return { excluded: ex, included: inc }
}

/** Map API report row (PUT/GET/mapped) into form bucket fields. */
export function reportApiBucketsToFormState(row: Record<string, unknown>): {
  excludedMasterCodeIds: string[]
  includedMasterCodeIds: string[]
  excludedActivityCodes: string[]
  includedActivityCodes: string[]
} {
  const { excluded, included } = parseReportMasterCodeDataFromRow(row)
  return bucketsToFormFields(excluded, included)
}

export function bucketsToFormFields(
  excluded: ReportMasterCodeData,
  included: ReportMasterCodeData,
) {
  return {
    excludedMasterCodeIds: excluded.masterCodeIds.map(String),
    includedMasterCodeIds: included.masterCodeIds.map(String),
    excludedActivityCodes: excluded.activityCodes,
    includedActivityCodes: included.activityCodes,
  }
}

/**
 * When the user toggles Exclusion/Inclusion, swap buckets so prior selections
 * become the new active bucket, then recompute complements from catalogs.
 */
/** Preview both buckets from the active selection only (for summary panels while editing). */
export function previewMasterCodeBuckets(
  mode: "exclude" | "include",
  excludedMasterCodeIds: string[],
  includedMasterCodeIds: string[],
  catalogMasterCodeIds: number[],
): { excludedMasterCodeIds: string[]; includedMasterCodeIds: string[] } {
  const catalog = [...new Set(catalogMasterCodeIds)].filter((n) => n >= 1)
  if (mode === "include") {
    const included = [...includedMasterCodeIds]
    const excluded =
      catalog.length > 0 ? complementMasterCodeIdStrings(catalog, included) : [...excludedMasterCodeIds]
    return { excludedMasterCodeIds: excluded, includedMasterCodeIds: included }
  }
  const excluded = [...excludedMasterCodeIds]
  const included =
    catalog.length > 0 ? complementMasterCodeIdStrings(catalog, excluded) : [...includedMasterCodeIds]
  return { excludedMasterCodeIds: excluded, includedMasterCodeIds: included }
}

/** Included master code ids used to load activities (not the excluded bucket). */
export function includedMasterCodeIdsForActivityCatalog(
  masterCodeExclusionMode: "exclude" | "include",
  excludedMasterCodeIds: string[],
  includedMasterCodeIds: string[],
  catalogMasterCodeIds: number[],
): string[] {
  return previewMasterCodeBuckets(
    masterCodeExclusionMode,
    excludedMasterCodeIds,
    includedMasterCodeIds,
    catalogMasterCodeIds,
  ).includedMasterCodeIds
}

/** Included activity codes to persist; excluded activities are not sent on save. */
export function includedActivityCodesForSave(
  activityExclusionMode: "exclude" | "include",
  excludedActivityCodes: string[],
  includedActivityCodes: string[],
  catalogActivityCodes: string[],
): string[] {
  return previewActivityBuckets(
    activityExclusionMode,
    excludedActivityCodes,
    includedActivityCodes,
    catalogActivityCodes,
  ).includedActivityCodes
}

export function previewActivityBuckets(
  mode: "exclude" | "include",
  excludedActivityCodes: string[],
  includedActivityCodes: string[],
  catalogActivityCodes: string[],
): { excludedActivityCodes: string[]; includedActivityCodes: string[] } {
  const catalog = [...new Set(catalogActivityCodes.map((c) => c.trim()).filter(Boolean))]
  if (mode === "include") {
    const included = [...includedActivityCodes]
    const excluded =
      catalog.length > 0
        ? complementActivityCodeStrings(catalog, included)
        : [...excludedActivityCodes]
    return { excludedActivityCodes: excluded, includedActivityCodes: included }
  }
  const excluded = [...excludedActivityCodes]
  const included =
    catalog.length > 0
      ? complementActivityCodeStrings(catalog, excluded)
      : [...includedActivityCodes]
  return { excludedActivityCodes: excluded, includedActivityCodes: included }
}

/**
 * Move the user's current selection into the new active bucket; clear the other until Save.
 */
export function reassignActiveMasterCodesForModeChange(
  previousMode: "exclude" | "include",
  nextMode: "exclude" | "include",
  excludedMasterCodeIds: string[],
  includedMasterCodeIds: string[],
): { excludedMasterCodeIds: string[]; includedMasterCodeIds: string[] } {
  const prevActive =
    previousMode === "include" ? [...includedMasterCodeIds] : [...excludedMasterCodeIds]
  if (nextMode === "include") {
    return { excludedMasterCodeIds: [], includedMasterCodeIds: prevActive }
  }
  return { excludedMasterCodeIds: prevActive, includedMasterCodeIds: [] }
}

export function reassignActiveActivitiesForModeChange(
  previousMode: "exclude" | "include",
  nextMode: "exclude" | "include",
  excludedActivityCodes: string[],
  includedActivityCodes: string[],
): { excludedActivityCodes: string[]; includedActivityCodes: string[] } {
  const prevActive =
    previousMode === "include" ? [...includedActivityCodes] : [...excludedActivityCodes]
  if (nextMode === "include") {
    return { excludedActivityCodes: [], includedActivityCodes: prevActive }
  }
  return { excludedActivityCodes: prevActive, includedActivityCodes: [] }
}

export function syncMasterCodeBucketsOnModeChange(
  previousMode: "exclude" | "include",
  nextMode: "exclude" | "include",
  excludedMasterCodeIds: string[],
  includedMasterCodeIds: string[],
  catalogMasterCodeIds: number[],
) {
  const reassigned = reassignActiveMasterCodesForModeChange(
    previousMode,
    nextMode,
    excludedMasterCodeIds,
    includedMasterCodeIds,
  )
  return previewMasterCodeBuckets(
    nextMode,
    reassigned.excludedMasterCodeIds,
    reassigned.includedMasterCodeIds,
    catalogMasterCodeIds,
  )
}

export function syncActivityBucketsOnModeChange(
  previousMode: "exclude" | "include",
  nextMode: "exclude" | "include",
  excludedActivityCodes: string[],
  includedActivityCodes: string[],
  catalogActivityCodes: string[],
) {
  const reassigned = reassignActiveActivitiesForModeChange(
    previousMode,
    nextMode,
    excludedActivityCodes,
    includedActivityCodes,
  )
  return previewActivityBuckets(
    nextMode,
    reassigned.excludedActivityCodes,
    reassigned.includedActivityCodes,
    catalogActivityCodes,
  )
}

/** @deprecated Use syncMasterCodeBucketsOnModeChange + syncActivityBucketsOnModeChange */
export function syncReportBucketsOnModeChange(
  previousMode: "exclude" | "include",
  nextMode: "exclude" | "include",
  excludedMasterCodeIds: string[],
  includedMasterCodeIds: string[],
  excludedActivityCodes: string[],
  includedActivityCodes: string[],
  catalogMasterCodeIds: number[],
  catalogActivityCodes: string[],
) {
  const mc = syncMasterCodeBucketsOnModeChange(
    previousMode,
    nextMode,
    excludedMasterCodeIds,
    includedMasterCodeIds,
    catalogMasterCodeIds,
  )
  const act = syncActivityBucketsOnModeChange(
    previousMode,
    nextMode,
    excludedActivityCodes,
    includedActivityCodes,
    catalogActivityCodes,
  )
  return { ...mc, ...act }
}

/** Recompute only activity complements (keeps master codes + mode). */
export function hydrateActivityBucketsOnly(
  excludedActivityCodes: string[],
  includedActivityCodes: string[],
  catalogActivityCodes: string[],
): { excludedActivityCodes: string[]; includedActivityCodes: string[] } {
  const hydrated = hydrateReportBucketComplements(
    { masterCodeIds: [], activityCodes: excludedActivityCodes },
    { masterCodeIds: [], activityCodes: includedActivityCodes },
    [],
    catalogActivityCodes,
  )
  return {
    excludedActivityCodes: hydrated.excluded.activityCodes,
    includedActivityCodes: hydrated.included.activityCodes,
  }
}

/** Parse API row and hydrate complements when catalogs are available. */
export function resolveReportBucketsForForm(
  row: Record<string, unknown>,
  catalogMasterCodeIds: number[],
  catalogActivityCodes: string[],
) {
  const { excluded, included } = parseReportMasterCodeDataFromRow(row)
  const hydrated = hydrateReportBucketComplements(
    excluded,
    included,
    catalogMasterCodeIds,
    catalogActivityCodes,
  )
  return bucketsToFormFields(hydrated.excluded, hydrated.included)
}

export function buildReportMasterCodeSavePayload(
  excludedMasterCodeIds: string[],
  excludedActivityCodes: string[],
  includedMasterCodeIds: string[],
  includedActivityCodes: string[],
): {
  excludedMasterCodeData: ReportMasterCodeDataInput
  includedMasterCodeData: ReportMasterCodeDataInput
} {
  return {
    excludedMasterCodeData: {
      masterCodeIds: excludedMasterCodeIds.map((id) => Number(id)).filter((n) => n >= 1),
      activityCodes: excludedActivityCodes,
    },
    includedMasterCodeData: {
      masterCodeIds: includedMasterCodeIds.map((id) => Number(id)).filter((n) => n >= 1),
      activityCodes: includedActivityCodes,
    },
  }
}
