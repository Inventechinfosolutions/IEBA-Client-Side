import type {
  DepartmentRoleDetail,
  DepartmentRolePermissionCatalog,
  DepartmentRoleCreatePermissionRef,
  DepartmentRolePermissionModuleGroup,
  DepartmentRolePermissionItem,
} from "../types"

/** Converts a raw permissionId like "timestudyprogram:add" to a display label. Used by both UI and API mapping. */
export function prettifyPermissionId(pid: string): string {
  const parts = pid.split(":")
  if (parts.length < 2) return pid
  const [topic, action] = parts
  const topicLabel = topic
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
  const actionLabel = action.charAt(0).toUpperCase() + action.slice(1)
  return `${actionLabel} ${topicLabel}`
}

/** Returns the server-provided permission bundle for a label, or undefined if not available. */
function bundleForLabel(
  label: string,
  catalog: DepartmentRolePermissionCatalog | null | undefined
): DepartmentRoleCreatePermissionRef[] | undefined {
  const fromServer = catalog?.[label]
  if (fromServer && fromServer.length > 0) {
    return fromServer.map((r) => ({
      id: r.permissionId,
      moduleId: r.moduleId,
    }))
  }
  return undefined
}

export function buildCreateDepartmentRolePermissions(
  selectedLabels: readonly string[],
  catalog?: DepartmentRolePermissionCatalog | null
): DepartmentRoleCreatePermissionRef[] {
  const dedupe = new Map<string, DepartmentRoleCreatePermissionRef>()
  if (!catalog) return []

  for (const label of selectedLabels) {
    if (!label.includes(":")) {
      // Whole module selected
      const bundle = bundleForLabel(label, catalog)
      if (!bundle?.length) continue
      for (const p of bundle) {
        dedupe.set(`${p.id}\0${p.moduleId}`, p)
      }
    } else {
      // Individual permission selected: "Module Name:Permission Display Label"
      const [modName, permLabel] = label.split(":")
      const modBundle = catalog[modName.trim()]
      if (!modBundle) continue
      
      // Find the specific permission in this module's bundle
      const match = modBundle.find((p) => {
        const fullDisplay = prettifyPermissionId(p.permissionId)
        return fullDisplay === permLabel.trim()
      })

      if (match) {
        dedupe.set(`${match.permissionId}\0${match.moduleId}`, {
          id: match.permissionId,
          moduleId: match.moduleId
        })
      }
    }
  }
  return [...dedupe.values()]
}

export function permissionLabelsToApiPermissionIds(
  labels: readonly string[],
  catalog: DepartmentRolePermissionCatalog | null | undefined
): any[] {
  const expanded = buildCreateDepartmentRolePermissions(labels, catalog)
  return expanded.map((x) => x.id)
}

/**
 * Returns Module:Permission labels for shuttle assigned list from a GET detail response.
 * Handles both fully-assigned modules and individual sub-permissions.
 */
export function assignedModuleLabelsFromDetail(
  detail: DepartmentRoleDetail,
  fullCatalog?: DepartmentRolePermissionCatalog | null
): string[] {
  const out: string[] = []
  
  // Use global catalog to determine if a module is fully or partially assigned.
  // Fallback to role-specific catalog if global is not provided.
  const universe = fullCatalog || detail.permissionCatalogByModuleName
  if (!universe) return []

  const assignedPairs = new Set<string>()
  detail.permissionGroups.forEach((g: DepartmentRolePermissionModuleGroup) => {
    g.permissions.forEach((p: DepartmentRolePermissionItem) => {
      assignedPairs.add(`${p.permissionId}\0${g.moduleId}`)
    })
  })

  // Iterate over modules in the universe
  for (const [label, bundle] of Object.entries(universe)) {
    const assignedInBundle = bundle.filter(p => assignedPairs.has(`${p.permissionId}\0${p.moduleId}`))
    
    if (assignedInBundle.length === 0) continue
    
    // Compare against the universe bundle size to see if it's truly "Fully assigned"
    if (assignedInBundle.length === bundle.length) {
      out.push(label)
    } else {
      // Partially assigned: Add Module:Permission keys for each
      assignedInBundle.forEach(p => {
        const displayLabel = prettifyPermissionId(p.permissionId)
        const fullLabel = `${label}:${displayLabel}`
        out.push(fullLabel)
      })
    }
  }
  return out
}
