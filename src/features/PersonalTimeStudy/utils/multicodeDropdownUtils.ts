/**
 * API may return an array of department bundles or `{ data: [...] }` (envelope).
 */
export function coerceProgramsActivitiesBundles(raw: unknown): any[] {
  if (raw == null) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === "object" && raw !== null && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: any[] }).data
  }
  return []
}

/**
 * Multicode API may return department bundles like `programs-activities`, or a flat array of
 * program objects (`data: [{ id, code, name, departmentId, ... }]`).
 */
export function normalizeMulticodeDropdownPayload(raw: unknown, mainDropdown?: any[]): any[] {
  if (raw == null) return []
  let rows: any[] = []
  if (Array.isArray(raw)) rows = raw
  else if (typeof raw === "object" && raw !== null && Array.isArray((raw as { data?: unknown }).data)) {
    rows = (raw as { data: any[] }).data
  }
  if (rows.length === 0) return []
  const first = rows[0]
  if (first && typeof first === "object" && Array.isArray(first.programs)) {
    return rows
  }

  const deptMeta = (deptId: number) => {
    const bundle = mainDropdown?.find((d: any) => Number(d.departmentId) === Number(deptId))
    return {
      departmentId: deptId,
      departmentCode: bundle?.departmentCode,
      programs: [] as any[],
      activities: Array.isArray(bundle?.activities) ? [...bundle.activities] : [],
    }
  }

  const byDept = new Map<number, any>()
  for (const p of rows) {
    if (!p || typeof p !== "object") continue
    if (Array.isArray((p as any).programs)) continue
    const rawDept = (p as any).departmentId ?? (p as any).department?.id
    const deptId =
      rawDept != null && rawDept !== "" && Number.isFinite(Number(rawDept)) ? Number(rawDept) : 0
    if (!byDept.has(deptId)) byDept.set(deptId, deptMeta(deptId))
    const wrap = { ...(p as object) } as any
    if (!wrap.departmentCode && mainDropdown?.length) {
      const b = mainDropdown.find((d: any) => Number(d.departmentId) === deptId)
      if (b?.departmentCode) wrap.departmentCode = b.departmentCode
    }
    byDept.get(deptId)!.programs.push(wrap)
  }
  return Array.from(byDept.values()).filter((b) => (b.programs ?? []).length > 0)
}

export function pickDepartmentIdFromEntity(entity: unknown): number | undefined {
  if (!entity || typeof entity !== "object") return undefined
  const o = entity as Record<string, unknown>
  const deptObj = o.department as Record<string, unknown> | undefined
  const raw =
    o.departmentId ??
    o.department_id ??
    deptObj?.id ??
    deptObj?.departmentId ??
    deptObj?.department_id
  if (raw == null || raw === "") return undefined
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return n
}

/** Resolves department id for a program id by scanning department bundles (program row, then bundle). */
export function findProgramDepartmentInBundles(
  bundles: any[] | undefined,
  programIdStr: string | undefined,
): number | undefined {
  const trimmed = programIdStr?.trim()
  if (!trimmed || !bundles?.length) return undefined
  for (const d of bundles) {
    const pr = (d.programs ?? []).find((p: any) => String(p.id) === trimmed)
    if (!pr) continue
    const fromProgram = pickDepartmentIdFromEntity(pr)
    if (fromProgram != null) return fromProgram
    const fromBundle = pickDepartmentIdFromEntity(d)
    if (fromBundle != null) return fromBundle
  }
  return undefined
}

/**
 * Secondary pass when `findProgramDepartmentInBundles` finds no id: infer from activities in the same
 * bundle, or from the bundle document `id` (some legacy payloads use it as department key).
 */
export function inferDepartmentIdForProgramSelection(
  programIdStr: string | undefined,
  bundles: any[] | undefined,
): number | undefined {
  const trimmed = programIdStr?.trim()
  if (!trimmed || !bundles?.length) return undefined

  const fromDirect = findProgramDepartmentInBundles(bundles, trimmed)
  if (fromDirect != null) return fromDirect

  for (const d of bundles) {
    const programs = d.programs ?? []
    const pr = programs.find((p: any) => String(p.id) === trimmed)
    if (!pr) continue

    for (const a of d.activities ?? []) {
      const fromAct = pickDepartmentIdFromEntity(a)
      if (fromAct != null) return fromAct
    }

    const bundleNumericId = Number((d as Record<string, unknown>).id)
    if (Number.isFinite(bundleNumericId) && bundleNumericId > 0) return bundleNumericId
  }

  return undefined
}

/** Merges multicode programs/activities into main bundles so leave APIs can resolve codes by id. */
export function mergeDropdownDataForLeaveLookups(main: any[] | undefined, multicodeRaw: unknown): any[] | undefined {
  const bundles = normalizeMulticodeDropdownPayload(multicodeRaw, main)
  if (!bundles.length) return main
  if (!main?.length) {
    return bundles.map((mb) => ({
      ...mb,
      programs: [...(mb.programs ?? [])],
      activities: [...(mb.activities ?? [])],
    }))
  }
  const mainCopy = main.map((b) => ({
    ...b,
    programs: [...(b.programs ?? [])],
    activities: [...(b.activities ?? [])],
  }))

  for (const mb of bundles) {
    const idx = mainCopy.findIndex((m) => Number(m.departmentId) === Number(mb.departmentId))
    if (idx >= 0) {
      const progIds = new Set((mainCopy[idx].programs ?? []).map((p: any) => p.id))
      for (const p of mb.programs ?? []) {
        if (!progIds.has(p.id)) {
          mainCopy[idx].programs.push(p)
          progIds.add(p.id)
        }
      }
      const actIds = new Set((mainCopy[idx].activities ?? []).map((a: any) => a.id))
      for (const a of mb.activities ?? []) {
        if (!actIds.has(a.id)) {
          mainCopy[idx].activities.push(a)
          actIds.add(a.id)
        }
      }
    } else {
      mainCopy.push({ ...mb, programs: [...(mb.programs ?? [])], activities: [...(mb.activities ?? [])] })
    }
  }
  return mainCopy
}
