import { useCallback, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { Label } from "@/components/ui/label"
import { addRoleFormSchema } from "../schemas"
import type { 
  DepartmentRoleAddProps, 
  AddRoleFormSchema,
  TransferPanelItem 
} from "../types"
import {
  assignedModuleLabelsFromDetail,
  permissionLabelsToApiPermissionIds,
  prettifyPermissionId,
} from "../api/departmentRoleCreatePermissions"
import { cn } from "@/lib/utils"
import { TransferPanel } from "./TransferPanel"
import { usePermissionCatalogQuery } from "../queries/getPermissionCatalog"
import { useDepartmentRoleDetailQuery } from "../queries/getDepartmentRoleById"
import type { DepartmentRoleDetail } from "../types"


export function DepartmentRoleAdd({
  open,
  onOpenChange,
  departments,
  initialDepartment,
  mode = "create",
  editRoleId = null,
  onSubmit,
  isSubmitting = false,
}: DepartmentRoleAddProps) {
  const [selectedAvailable, setSelectedAvailable] = useState<Set<string>>(new Set())
  const [selectedAssigned, setSelectedAssigned] = useState<Set<string>>(new Set())

  // Always fetch catalog when dialog is open
  const catalogQuery = usePermissionCatalogQuery(open)
  const globalCatalog = catalogQuery.data

  // Fetch role details when in edit mode
  const localEditQuery = useDepartmentRoleDetailQuery(editRoleId, {
    enabled: open && mode === "edit" && Boolean(editRoleId),
  })

  const editDetail = (localEditQuery.data || null) as DepartmentRoleDetail | null
  const isEditDetailLoading = localEditQuery.isLoading || localEditQuery.isFetching
  const editDetailError = localEditQuery.error as Error | null


  const departmentOptions = useMemo(() => {
    const base = [...departments]
    const resolved = editDetail?.departmentName?.trim() ?? ""
    if (mode === "edit" && resolved) {
      const exists = base.some((x) => x.trim() === resolved)
      if (!exists) base.push(resolved)
    }
    return base
  }, [departments, editDetail?.departmentName, mode])

  const editFormValues = useMemo((): AddRoleFormSchema | undefined => {
    if (mode !== "edit" || !editDetail) return undefined
    const assigned = assignedModuleLabelsFromDetail(editDetail, globalCatalog)
    return {
      department: editDetail.departmentName?.trim() ?? "",
      roleName: editDetail.roleName,
      active: editDetail.active,
      assignedPermissions: assigned,
    }
  }, [mode, editDetail, globalCatalog])

  const form = useForm<AddRoleFormSchema>({
    resolver: zodResolver(addRoleFormSchema),
    defaultValues: {
      department: initialDepartment ?? departments[0] ?? "",
      roleName: "",
      active: true,
      assignedPermissions: [],
    },
    ...(editFormValues ? { values: editFormValues } : {}),
  })

  const activeValue = useWatch({
    control: form.control,
    name: "active",
  })

  const assignedPermissions = (useWatch({
    control: form.control,
    name: "assignedPermissions",
  }) || []) as string[]

  // Catalog Source Logic:
  // 1. If globalCatalog is available, it's the most complete source for ALL permissions.
  // 2. While loading or in Edit mode, we may also have editDetail.permissionCatalogByModuleName (which only has assigned perms).
  // 3. We merge them so we never lose reference to a permission.
  const activeCatalog = useMemo(() => {
    const global = globalCatalog || {}
    const edit = (mode === "edit" ? editDetail?.permissionCatalogByModuleName : null) || {}
    
    // Merge: Prioritize global info, but keep anything unique to edit
    const merged = { ...edit, ...global }
    return merged
  }, [mode, editDetail?.permissionCatalogByModuleName, globalCatalog])

  const getPermissionsForLabel = useCallback(
    (label: string): string[] => {
      const serverPerms = activeCatalog?.[label]
      if (serverPerms && serverPerms.length > 0) {
        return serverPerms.map((p) => prettifyPermissionId(p.permissionId))
      }
      return []
    },
    [activeCatalog]
  )

  const toggleAvailable = (id: string) => {
    const childPerms = activeCatalog?.[id]?.map((p) => prettifyPermissionId(p.permissionId)) || []

    setSelectedAvailable((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        childPerms.forEach(p => next.delete(`${id}:${p}`))
      } else {
        next.add(id)
        childPerms.forEach(p => next.add(`${id}:${p}`))
      }
      return next
    })
  }

  const toggleAvailablePerm = (itemId: string, perm: string) => {
    const key = `${itemId}:${perm}`
    setSelectedAvailable((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleAssigned = (id: string) => {
    const childPerms = activeCatalog?.[id]?.map((p) => prettifyPermissionId(p.permissionId)) || []

    setSelectedAssigned((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        childPerms.forEach(p => next.delete(`${id}:${p}`))
      } else {
        next.add(id)
        childPerms.forEach(p => next.add(`${id}:${p}`))
      }
      return next
    })
  }

  const toggleAssignedPerm = (itemId: string, perm: string) => {
    const key = `${itemId}:${perm}`
    setSelectedAssigned((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAllAvailable = (checked: boolean) => {
    if (!activeCatalog) return
    const moduleLabels = Object.keys(activeCatalog)
    if (checked) {
      const allIds = new Set<string>()
      moduleLabels.forEach((label: string) => {
        if (!assignedPermissions.includes(label)) {
          allIds.add(label)
          getPermissionsForLabel(label).forEach((p: string) => allIds.add(`${label}:${p}`))
        }
      })
      setSelectedAvailable(allIds)
    } else {
      setSelectedAvailable(new Set())
    }
  }

  const selectAllAssigned = (checked: boolean) => {
    if (checked) {
      const allIds = new Set<string>()
      assignedPermissions.forEach(p => {
        if (!p.includes(":")) {
          allIds.add(p)
          getPermissionsForLabel(p).forEach(cp => allIds.add(`${p}:${cp}`))
        } else {
          allIds.add(p)
        }
      })
      setSelectedAssigned(allIds)
    } else {
      setSelectedAssigned(new Set())
    }
  }

  const transferToAssigned = async () => {
    const toAssign = Array.from(selectedAvailable)
    if (toAssign.length === 0) return
    
    const nextAssigned = new Set(assignedPermissions)
    toAssign.forEach(id => {
      if (!id.includes(":")) {
        // Whole module selected: remove all individual perms of this module and add the module label
        Array.from(nextAssigned).forEach(cur => {
          if (cur.startsWith(`${id}:`)) nextAssigned.delete(cur)
        })
        nextAssigned.add(id)
      } else {
        // Individual permission selected
        const [mod] = id.split(":")
        // Only add if the whole module isn't already assigned
        if (!nextAssigned.has(mod)) {
          nextAssigned.add(id)
        }
      }
    })

    form.setValue("assignedPermissions", Array.from(nextAssigned), { shouldDirty: true })
    setSelectedAvailable(new Set())
  }

  const transferToAvailable = async () => {
    const toRemove = Array.from(selectedAssigned)
    if (toRemove.length === 0) return
    
    const nextAssigned = new Set(assignedPermissions)
    toRemove.forEach(id => {
      if (!id.includes(":")) {
        // Removing whole module: just delete the label and any stray perms
        nextAssigned.delete(id)
        Array.from(nextAssigned).forEach(cur => {
          if (cur.startsWith(`${id}:`)) nextAssigned.delete(cur)
        })
      } else {
        // Removing an individual permission
        const [mod, perm] = id.split(":")
        
        if (nextAssigned.has(mod)) {
          // If the WHOLE module was assigned, we must remove the module label 
          // and add back all individual permissions EXCEPT the one being removed.
          nextAssigned.delete(mod)
          const allModulePerms = getPermissionsForLabel(mod)
          allModulePerms.forEach(p => {
            if (p !== perm) {
              nextAssigned.add(`${mod}:${p}`)
            }
          })
        } else {
          // Module wasn't whole, just delete the individual perm
          nextAssigned.delete(id)
        }
      }
    })

    form.setValue("assignedPermissions", Array.from(nextAssigned), { shouldDirty: true })
    setSelectedAssigned(new Set())
  }

  const handleSubmit = form.handleSubmit((values) => {
    if (mode === "edit" && editRoleId && editDetail) {
      const initialLabels = assignedModuleLabelsFromDetail(
        editDetail,
        globalCatalog
      )
      const nextLabels = values.assignedPermissions

      // Flatten both to exact permission IDs first to prevent half-module glitches
      const initialPermIds = permissionLabelsToApiPermissionIds(
        initialLabels,
        activeCatalog
      )
      const nextPermIds = permissionLabelsToApiPermissionIds(
        nextLabels,
        activeCatalog
      )

      const permIdsToAdd = nextPermIds.filter((id) => !initialPermIds.includes(id))
      const permIdsToRemove = initialPermIds.filter((id) => !nextPermIds.includes(id))

      onSubmit({
        childId: editRoleId,
        roleName: values.roleName.trim(),
        active: values.active,
        permIdsToAdd,
        permIdsToRemove,
      })
      return
    }

    onSubmit({
      department: values.department,
      roleName: values.roleName.trim(),
      active: values.active,
      assignedPermissions: values.assignedPermissions,
      permissionCatalogByModuleName: globalCatalog,
    })
  })

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedAvailable(new Set())
      setSelectedAssigned(new Set())
      form.reset()
    }
    onOpenChange(next)
  }

  const showEditError = mode === "edit" && Boolean(editRoleId) && editDetailError != null
  const showEditLoading = 
    (mode === "edit" && Boolean(editRoleId) && !editDetailError && isEditDetailLoading) || 
    (open && !globalCatalog && catalogQuery.isLoading)

  const editFormReady = mode === "create" ? !!globalCatalog : (Boolean(editDetail) && !!globalCatalog)
  
  const transferDisabled = mode === "edit" && !editFormReady
  const submitDisabled = isSubmitting || (mode === "edit" && !editFormReady)

  // For available items, use the merged catalog (shows all permissions minus assigned ones)
  const availableItems = useMemo((): TransferPanelItem[] => {
    if (Object.keys(activeCatalog).length === 0) return []
    
    const moduleLabels = Object.keys(activeCatalog)
    
    return moduleLabels
      .map((label: string) => {
        const allPermsInModule = activeCatalog[label]?.map((p) => prettifyPermissionId(p.permissionId)) || []
        
        // Check if whole module is assigned
        const isWholeModuleAssigned = assignedPermissions.includes(label)
        
        // Filter out individual permissions that are assigned
        const availablePerms = allPermsInModule.filter((perm: string) => {
          // If whole module is assigned, no individual permissions of this module are available
          if (isWholeModuleAssigned) return false
          
          // Check if this specific permission is individually assigned
          const individualKey = `${label}:${perm}`
          return !assignedPermissions.includes(individualKey)
        })
        
        // Show module even if it has just 1 available permission
        if (availablePerms.length === 0) {
          return null
        }
        
        return {
          id: label,
          name: label,
          permissions: availablePerms,
        }
      })
      .filter((item): item is TransferPanelItem => item !== null)
  }, [assignedPermissions, activeCatalog])

  const assignedItems = useMemo((): TransferPanelItem[] => {
    // Collect unique module names from assigned list
    const activeModules = new Set<string>()
    assignedPermissions.forEach(p => {
      if (p.includes(":")) activeModules.add(p.split(":")[0])
      else activeModules.add(p)
    })

    return Array.from(activeModules)
      .map((label) => {
        const all = getPermissionsForLabel(label)
        const isWholeAssigned = assignedPermissions.includes(label)
        // If whole module is assigned, show all. Otherwise show just the subset.
        const filtered = isWholeAssigned 
          ? all 
          : all.filter(p => assignedPermissions.includes(`${label}:${p}`))

        return {
          id: label,
          name: label,
          permissions: filtered,
        }
      })
  }, [assignedPermissions, getPermissionsForLabel])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[92vh] w-[1200px] max-w-[98vw] min-h-0 flex-col overflow-hidden bg-white p-[2%_5%] data-[state=open]:slide-in-from-right-1/2 data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-top-[48%] data-[state=closed]:slide-out-to-top-[48%]"
        overlayClassName="bg-black/40"
      >
        <DialogHeader className="flex shrink-0 flex-col gap-3">
          <DialogTitle className="text-center text-xl text-black">
            {mode === "edit" ? "Edit Role" : "Add Role"}
          </DialogTitle>
          <div className="flex items-center justify-end gap-2">
            {mode !== "edit" && (
              <>
                <Checkbox
                  id="active"
                  checked={activeValue}
                  onCheckedChange={(checked) =>
                    form.setValue("active", checked === true)
                  }
                  className="border-[rgb(108,93,211)] data-[state=checked]:border-[rgb(108,93,211)] data-[state=checked]:bg-[rgb(108,93,211)]"
                />
                <Label
                  htmlFor="active"
                  className="cursor-pointer text-sm font-normal text-black"
                >
                  Active
                </Label>
              </>
            )}
          </div>
        </DialogHeader>

        {showEditError ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-4">
            <p className="text-center text-sm text-destructive">
              {editDetailError.message}
            </p>
            <Button
              type="button"
              variant="outline"
              className="min-h-[50px] min-w-[98px] border-[#DADADA] bg-[#DADADA] px-5 py-2.5 text-black hover:bg-[#d1d1d1]"
              onClick={() => handleOpenChange(false)}
            >
              Exit
            </Button>
          </div>
        ) : showEditLoading ? (
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <Loader2
              className="size-10 animate-spin text-[rgb(108,93,211)]"
              aria-label="Loading role"
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-4 pt-10 pb-2 pr-1">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-1">
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="department" className="text-black">
                    Department
                  </Label>
                  <Select
                    value={form.watch("department")}
                    onValueChange={(v) => form.setValue("department", v)}
                    disabled
                  >
                    <SelectTrigger
                      id="department"
                      className={cn(
                        "!h-[50px] w-full rounded-md border border-[#e5e5e5] bg-black/[0.04] px-[18px] text-black",
                        form.formState.errors.department &&
                          "border-destructive",
                        "cursor-not-allowed opacity-60"
                      )}
                    >
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.department && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.department.message}
                    </p>
                  )}
                </div>
                <div className="w-[62px] shrink-0" aria-hidden />
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="roleName" className="text-black">
                    Role Name
                  </Label>
                  <TitleCaseInput
                    id="roleName"
                    placeholder="Role Name"
                    disabled={mode === "edit"}
                    className={cn(
                      "h-[60px] w-full rounded-md border border-[#e5e5e5] bg-white px-[18px] py-1 text-black placeholder:text-muted-foreground",
                      form.formState.errors.roleName && "border-destructive",
                      mode === "edit" && "cursor-not-allowed opacity-60 bg-black/[0.04]"
                    )}
                    {...form.register("roleName")}
                  />
                  {form.formState.errors.roleName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.roleName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 py-4">
                <TransferPanel
                  title="All permissions"
                  items={availableItems}
                  selectedIds={Array.from(selectedAvailable)}
                  onToggleItem={toggleAvailable}
                  onTogglePermission={toggleAvailablePerm}
                  totalCount={availableItems.length}
                  allSelected={
                    availableItems.length > 0 &&
                    availableItems.every((item) => selectedAvailable.has(item.id))
                  }
                  onSelectAll={selectAllAvailable}
                />

                <div className="flex flex-col items-center justify-center gap-3">
                  <TransferListMoveButton
                    direction="forward"
                    onClick={() => void transferToAssigned()}
                    disabled={selectedAvailable.size === 0 || transferDisabled}
                    aria-label="Assign selected"
                  />
                  <TransferListMoveButton
                    direction="back"
                    onClick={() => void transferToAvailable()}
                    disabled={selectedAssigned.size === 0 || transferDisabled}
                    aria-label="Unassign selected"
                  />
                </div>

                <TransferPanel
                  title="Assigned permissions"
                  items={assignedItems}
                  selectedIds={Array.from(selectedAssigned)}
                  onToggleItem={toggleAssigned}
                  onTogglePermission={toggleAssignedPerm}
                  totalCount={assignedItems.length}
                  allSelected={
                    assignedItems.length > 0 &&
                    assignedItems.every((item) => selectedAssigned.has(item.id))
                  }
                  onSelectAll={selectAllAssigned}
                />
              </div>
              <div className="flex justify-end gap-2 p-1">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[50px] min-w-[98px] border-[#DADADA] bg-[#DADADA] px-5 py-2.5 text-black hover:bg-[#d1d1d1]"
                  onClick={() => handleOpenChange(false)}
                >
                  Exit
                </Button>
                <Button
                  type="submit"
                  disabled={submitDisabled}
                  className="min-h-[50px] min-w-[98px] bg-[rgb(108,93,211)] px-5 py-2.5 text-white hover:bg-[rgb(108,93,211)]/90"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
