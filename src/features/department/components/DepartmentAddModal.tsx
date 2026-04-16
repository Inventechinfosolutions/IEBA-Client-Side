import { useMemo, useState } from "react"
import { useForm, type Path } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    DEPARTMENT_FORM_DEFAULT_VALUES,
    departmentUpsertSchema,
} from "../schemas"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, CheckCircle2, X, Search, ChevronDown, Check } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/usePermissions"
import { useCreateDepartment } from "../mutations/createDepartment"
import { useUpdateDepartment } from "../mutations/updateDepartment"
import { useGetDepartmentById } from "../queries/getDepartmentById"
import { useGetMasterCodeOptions } from "../queries/getMasterCodeOptions"
import { departmentKeys } from "../keys"
import { queryClient } from "@/main"
import { apiGetUserDetails } from "@/features/user/api"
import type { UserDetailsDto } from "@/features/user/types"
import type { DepartmentContactUser } from "../queries/getDepartmentUsers"
import { useGetDepartmentUsers } from "../queries/getDepartmentUsers"
import {
    type Department,
    type DepartmentAddPageProps,
    type DepartmentContact,
    type DepartmentUpsertValues,
    type ActiveTab,
    type DetailsTab,
    type PendingTabChange,
    type ModifiedContacts,
    type HandleTabChange,
    type HandleDetailsTabChange,
    DEPARTMENT_CONTACT_FORM_PREFIX,
    DEPARTMENT_CONTACT_ID_FIELD,
    DEPARTMENT_SETTINGS_ROWS,
    DETAIL_TABS,
} from "../types"

function enrichContactFromUsers(
    contactId: string | null | undefined,
    contact: DepartmentContact,
    users: DepartmentContactUser[],
): DepartmentContact {
    const uid = contactId?.trim()
    if (!uid) return contact
    if (typeof contact.name === "string" && contact.name.trim() !== "") return contact
    const u = users.find((x) => x.id === uid)
    if (!u) return contact
    return {
        ...contact,
        name: u.name,
        email: u.email,
        phone: u.phone,
        location: u.location,
    }
}

function buildDepartmentUpsertFormValues(
    dept: Department,
    users: DepartmentContactUser[],
): DepartmentUpsertValues {
    const { id: _omitId, ...rest } = dept
    return {
        ...rest,
        primaryContact: enrichContactFromUsers(
            rest.primaryContactId,
            rest.primaryContact,
            users,
        ),
        secondaryContact: enrichContactFromUsers(
            rest.secondaryContactId,
            rest.secondaryContact,
            users,
        ),
        billingContact: enrichContactFromUsers(
            rest.billingContactId,
            rest.billingContact,
            users,
        ),
    }
}

function fetchUserDetailsFresh(userId: string): Promise<UserDetailsDto> {
    return queryClient.fetchQuery({
        queryKey: ["user-details", userId, Date.now()],
        queryFn: () => apiGetUserDetails(userId),
        staleTime: 0,
        gcTime: 0,
    })
}

function contactPhoneFromUserDetails(dto: UserDetailsDto): string {
    const contacts = dto.contacts ?? []
    for (const c of contacts) {
        const t = String(c.type ?? "").toLowerCase()
        if (t !== "mobile" && t !== "phone") continue
        const value = typeof c.value === "string" ? c.value.trim() : ""
        const cc = typeof c.countryCode === "string" ? c.countryCode.trim() : ""
        if (value) return cc ? `${cc}${value}` : value
        const phone = typeof c.phone === "string" ? c.phone.trim() : ""
        if (phone) return phone
    }
    return ""
}

function contactEmailFromUserDetails(dto: UserDetailsDto): string {
    const contacts = dto.contacts ?? []
    for (const c of contacts) {
        if (String(c.type ?? "").toLowerCase() !== "email") continue
        const value = typeof c.value === "string" ? c.value.trim() : ""
        if (value) return value
    }
    return dto.user?.loginId?.trim() ?? ""
}

export function DepartmentAddPage({ id, onClose }: DepartmentAddPageProps) {
    const [activeTab, setActiveTab] = useState<ActiveTab>("details")
    // In edit mode, start at Address first (then Primary → Secondary → Billing).
    // Create flow already starts at Address, so this keeps create behavior unchanged.
    const [detailsTab, setDetailsTab] = useState<DetailsTab>("address")
    const [showSummaryErrors, setShowSummaryErrors] = useState(false)
    const [isDepartmentSaved, setIsDepartmentSaved] = useState(!!id)
    const [departmentId, setDepartmentId] = useState<string | null>(id)
    const [showCreateConfirm, setShowCreateConfirm] = useState(false)
    const [showSaveContactConfirm, setShowSaveContactConfirm] = useState(false)
    const [pendingTabChange, setPendingTabChange] = useState<PendingTabChange | null>(null)
    const [modifiedContacts, setModifiedContacts] = useState<ModifiedContacts>({
        address: false, primary: false, secondary: false, billing: false
    })

    const [isMultiCodesOpen, setIsMultiCodesOpen] = useState(false)
    const [multiCodesSearch, setMultiCodesSearch] = useState("")

    const { canUpdate: hasUpdatePerm } = usePermissions()
    const canUpdateDepartment = hasUpdatePerm("department")

    const usersQuery = useGetDepartmentUsers()
    const userOptions = usersQuery.data ?? []

    const departmentQuery = useGetDepartmentById(departmentId)
    const existingDept = departmentQuery.data
    const isLoadingDept = departmentQuery.isLoading

    const masterCodesQuery = useGetMasterCodeOptions()
    const masterCodeOptions = masterCodesQuery.data ?? []
    const isLoadingMasterCodes = masterCodesQuery.isLoading || masterCodesQuery.isFetching
    const masterCodesErrorMessage =
        masterCodesQuery.error instanceof Error
            ? masterCodesQuery.error.message
            : masterCodesQuery.isError
              ? "Failed to load master codes"
              : null

    const valuesFromDepartmentQuery = useMemo((): DepartmentUpsertValues | undefined => {
        if (!departmentId || !existingDept) return undefined
        return buildDepartmentUpsertFormValues(existingDept, userOptions)
    }, [departmentId, existingDept, userOptions])

    const createDeptMutation = useCreateDepartment()
    const updateDeptMutation = useUpdateDepartment()

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        getValues,
        trigger,
        setError,
        formState: { errors },
    } = useForm<DepartmentUpsertValues>({
        resolver: zodResolver(departmentUpsertSchema),
        defaultValues: DEPARTMENT_FORM_DEFAULT_VALUES,
        values: valuesFromDepartmentQuery,
    })

    // Watch values for controlled components like Checkbox
    const active = watch("active")
    const settings = watch("settings")
    const currentCode = watch("code")
    const currentName = watch("name")
    const primaryContactId = watch("primaryContactId")
    const secondaryContactId = watch("secondaryContactId")
    const billingContactId = watch("billingContactId")

    const handleSave = async (opts?: { toastMode?: "none" | "createOrUpdate" }): Promise<boolean> => {
        if (createDeptMutation.isPending || updateDeptMutation.isPending) return false
        const toastMode = opts?.toastMode ?? "createOrUpdate"

        const values = getValues()
        if (departmentId) {
            try {
                await updateDeptMutation.mutateAsync({ id: departmentId, values })
                if (toastMode === "createOrUpdate") {
                    toast(
                        <div className="flex items-center gap-2 text-[14px]">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Department Updated Successfully
                        </div>
                    )
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to update department")
            }
            return true
        }
        try {
            const created = await createDeptMutation.mutateAsync(values)
            if (toastMode === "createOrUpdate") {
                toast(
                    <div className="flex items-center gap-2 text-[14px]">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Department Created Successfully
                    </div>
                )
            }
            const nextId = String(created.id)
            const optimisticDept: Department = {
                id: nextId,
                code: values.code.trim(),
                name: values.name.trim(),
                active: values.active,
                primaryContactId: values.primaryContactId ?? null,
                secondaryContactId: values.secondaryContactId ?? null,
                billingContactId: values.billingContactId ?? null,
                address: values.address,
                primaryContact: values.primaryContact,
                secondaryContact: values.secondaryContact,
                billingContact: values.billingContact,
                settings: values.settings,
            }
            queryClient.setQueryData(departmentKeys.detail(nextId), optimisticDept)
            setDepartmentId(nextId)
            setIsDepartmentSaved(true)
            return true
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to create department"
            toast.error(message)
            if (message.toLowerCase().includes("code already exists")) {
                setError("code", { type: "manual", message })
            }
            return false
        }
    }

    const handleActualSave = async () => {
        setShowCreateConfirm(false)
        const ok = await handleSave()
        if (!ok) return
        setActiveTab("details")
        setDetailsTab("primary")
    }

    /** Exit always discards without calling the API. Persist only via Save / OK on create confirm / contact Save when a row exists. */
    const handleExit = () => {
        onClose()
    }

    const onSubmit = (_data: DepartmentUpsertValues) => {
        // If we're on the settings tab and submitting the main form
        if (activeTab === "settings") {
            setShowCreateConfirm(true)
        }
    }

    const onContactSave = async () => {
        if (detailsTab === "address") return

        const contactKey = DEPARTMENT_CONTACT_FORM_PREFIX[detailsTab]
        const isValid = await trigger([
            `${contactKey}.name` as const,
            `${contactKey}.email` as const,
            `${contactKey}.phone` as const
        ])

        if (!isValid) return

        const titleCaseTab = detailsTab.charAt(0).toUpperCase() + detailsTab.slice(1)
        const contactToastMessage =
            departmentId != null
                ? `${titleCaseTab} contact ${id ? "updated" : "saved"} successfully`
                : `${titleCaseTab} contact step completed (not saved until you create the department)`
        toast(
            <div className="flex items-center gap-2 text-[14px]">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {contactToastMessage}
            </div>
        )
        setModifiedContacts((prev: ModifiedContacts) => ({ ...prev, [detailsTab]: false }))
        
        if (detailsTab === "primary") setDetailsTab("secondary")
        else if (detailsTab === "secondary") setDetailsTab("billing")

        // Only persist to backend after the department exists (created) or in edit mode.
        if (departmentId) {
            void handleSave({ toastMode: "none" })
        }
    }

    const onAddressSave = async () => {
        const isValid = await validateDetailsTab()
        if (!isValid) return

        const hasExistingDepartment = id != null || departmentId != null
        if (hasExistingDepartment) {
            const ok = await handleSave({ toastMode: "none" })
            if (!ok) return
            toast(
                <div className="flex items-center gap-2 text-[14px]">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Address updated successfully
                </div>
            )
        }

        setModifiedContacts((prev: ModifiedContacts) => ({ ...prev, address: false }))
        setIsDepartmentSaved(true)

        setDetailsTab("primary")
        if (!id) setActiveTab("settings")
    }

    const handleConfirmContactSave = () => {
        onContactSave()
        setShowSaveContactConfirm(false)
        if (pendingTabChange) {
            if (pendingTabChange.type === 'active') setActiveTab(pendingTabChange.value as ActiveTab)
            else setDetailsTab(pendingTabChange.value as DetailsTab)
            setPendingTabChange(null)
        }
    }

    const validateDetailsTab = async () => {
        const isValid = await trigger([
            "code", "name", "address.street", "address.city", "address.state", "address.zip"
        ])
        if (!isValid) {
            setShowSummaryErrors(true)
            return false
        }
        setShowSummaryErrors(false)
        return true
    }

    const handleTabChange: HandleTabChange = async (value) => {
        if (detailsTab !== "address" && modifiedContacts[detailsTab]) {
            setPendingTabChange({ type: 'active', value: value as ActiveTab })
            setShowSaveContactConfirm(true)
            return
        }

        if (value === "settings") {
            const isValid = await validateDetailsTab()
            if (!isValid) return
        }
        if (value === "details" && (departmentId != null || isDepartmentSaved)) {
            // Edit mode should land on Address first; create mode can keep Primary as the default after save.
            setDetailsTab(id ? "address" : "primary")
        }
        setActiveTab(value as ActiveTab)
    }



    const handleDetailsTabChange: HandleDetailsTabChange = (tabId) => {
        if (tabId !== "address" && !isDepartmentSaved) return
        if (detailsTab !== "address" && modifiedContacts[detailsTab] && tabId !== detailsTab) {
            setPendingTabChange({ type: 'details', value: tabId })
            setShowSaveContactConfirm(true)
            return
        }
        setDetailsTab(tabId)
    }

    return (
        <>
            <Dialog open onOpenChange={(open) => { if (!open) handleExit() }}>
            <DialogContent className="max-w-[893px] p-0 max-h-[90vh] overflow-y-auto border-none shadow-2xl rounded-[12px] bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <DialogHeader className="bg-white px-6 py-4 text-center">
                    <DialogTitle className="text-center text-[22px] font-[600] text-[#111827]">
                        {id ? "Edit Department" : "Add Department"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <div className="px-6 py-4">
                            <TabsList className="grid !h-[62px] w-full grid-cols-2 items-stretch gap-0 overflow-hidden rounded-[6px] border border-[#E5E7EB] bg-white p-0">
                                <TabsTrigger
                                    value="details"
                                    className="h-full rounded-[8px] border-0 data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white data-[state=inactive]:text-[#9CA3AF] font-[500] text-[17px] transition-all shadow-none"
                                >
                                    Department Details
                                </TabsTrigger>
                                <TabsTrigger
                                    value="settings"
                                    disabled={isLoadingDept}
                                    className="h-full rounded-[8px] border-0 data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white data-[state=inactive]:text-[#9CA3AF] font-[500] text-[17px] transition-all shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Department Settings
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="details" className="mt-0">
                            <div className="px-8 pb-8 space-y-6">
                                {/* Header Row: Code, Name, Active */}
                                <div className="flex items-start justify-between gap-6 relative">
                                    <div className="w-[180px] space-y-2 mt-15">
                                        <Label htmlFor="code" className="text-[13px] font-[500] text-[#374151]">
                                            *Code
                                        </Label>
                                        <Input
                                            id="code"
                                            placeholder="Code"
                                            {...register("code")}
                                            className="h-[57px] rounded-[8px] border-[#E5E7EB] focus:ring-1 focus:ring-[#6C5DD3]"
                                        />
                                        {errors.code && <p className="text-[12px] text-red-500">{errors.code.message}</p>}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="name" className="text-[13px] font-[500] text-[#374151] mt-15">
                                            *Department
                                        </Label>
                                        <Input
                                            id="name"
                                            placeholder="Enter Department"
                                            {...register("name")}
                                            className="h-[57px] w-full rounded-[8px] border-[#E5E7EB] focus:ring-1 focus:ring-[#6C5DD3]"
                                        />
                                        {errors.name && <p className="text-[12px] text-red-500">{errors.name.message}</p>}
                                    </div>
                                    <div className="pt-10 flex items-center gap-2">
                                        <Checkbox
                                            id="active"
                                            checked={active}
                                            onCheckedChange={(val) => setValue("active", !!val)}
                                            className="h-[20px] w-[20px] data-[state=checked]:bg-[#6C5DD3] data-[state=checked]:border-[#6C5DD3]"
                                        />
                                        <Label htmlFor="active" className="text-[15px] font-[500] text-[#374151]">Active</Label>
                                    </div>
                                </div>

                                {/* Sub-Tabs: Address, Contacts */}
                                <div className="space-y-6 pt-4">
                                    <div className="flex gap-2 p-1 bg-transparent w-full">
                                        {DETAIL_TABS.map((tab) => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => handleDetailsTabChange(tab.id)}
                                                style={{ width: tab.width }}
                                                className={`h-[60px] rounded-[6px] text-[15px] font-[500] flex items-center justify-center gap-2 transition-all ${detailsTab === tab.id
                                                        ? "bg-[#6C5DD3] text-white shadow-md cursor-default"
                                                        : (tab.id !== "address" && !isDepartmentSaved) ? "bg-[#F3F4F6] text-[#6C5DD3] border border-[#E5E7EB] cursor-not-allowed" : "bg-white text-[#6C5DD3] border border-[#E5E7EB] cursor-pointer"
                                                    }`}
                                                disabled={tab.id !== "address" && !isDepartmentSaved}
                                            >
                                                {tab.label}
                                                {(tab.id !== "address") && (
                                                    <TooltipProvider delayDuration={100}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button type="button" className="flex items-center -ml-1 h-5 w-5 bg-transparent border-0 outline-none hover:bg-transparent">
                                                                    <HelpCircle className="h-5 w-5 opacity-70 cursor-pointer" />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent 
                                                                side="top"
                                                                className="bg-[#1f2937] text-white rounded-[6px] px-3 py-2 text-[13px] border-0 text-center leading-relaxed font-normal"
                                                            >
                                                                Please make sure user has created<br />before adding {tab.label}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Sub-Tab Content */}
                                    <div className="min-h-[220px] pt-4">
                                        {detailsTab === "address" && (
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">*Street</Label>
                                                    <Input
                                                        placeholder="Enter Street"
                                                        {...register("address.street")}
                                                        onChange={(e) => {
                                                            register("address.street").onChange(e);
                                                            setModifiedContacts((prev: ModifiedContacts) => ({ ...prev, address: true }));
                                                        }}
                                                        className="h-[57px] rounded-[8px] border-[#E5E7EB]"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">*City</Label>
                                                    <Input
                                                        placeholder="Enter City"
                                                        {...register("address.city")}
                                                        onChange={(e) => {
                                                            register("address.city").onChange(e);
                                                            setModifiedContacts((prev: ModifiedContacts) => ({ ...prev, address: true }));
                                                        }}
                                                        className="h-[57px] rounded-[8px] border-[#E5E7EB]"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">*State</Label>
                                                    <Input
                                                        placeholder="Enter State"
                                                        {...register("address.state")}
                                                        onChange={(e) => {
                                                            register("address.state").onChange(e);
                                                            setModifiedContacts((prev: ModifiedContacts) => ({ ...prev, address: true }));
                                                        }}
                                                        className="h-[57px] rounded-[8px] border-[#E5E7EB]"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">*Zip</Label>
                                                    <Input
                                                        placeholder="Enter Zip min 3 digits"
                                                        {...register("address.zip")}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            setValue("address.zip", val);
                                                            setModifiedContacts((prev: ModifiedContacts) => ({ ...prev, address: true }));
                                                        }}
                                                        className="h-[57px] rounded-[8px] border-[#E5E7EB]"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {(detailsTab === "primary" || detailsTab === "secondary" || detailsTab === "billing") && (
                                            <div key={detailsTab} className="grid grid-cols-2 gap-x-8 gap-y-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">
                                                        {detailsTab.charAt(0).toUpperCase() + detailsTab.slice(1)} Contact Name
                                                    </Label>
                                                    <Select
                                                        value={
                                                            detailsTab === "primary"
                                                                ? (primaryContactId ?? undefined)
                                                                : detailsTab === "secondary"
                                                                  ? (secondaryContactId ?? undefined)
                                                                  : (billingContactId ?? undefined)
                                                        }
                                                        onValueChange={(userId) => {
                                                            const key = DEPARTMENT_CONTACT_FORM_PREFIX[detailsTab]
                                                            const idKey = DEPARTMENT_CONTACT_ID_FIELD[detailsTab]
                                                            setValue(idKey, userId)
                                                            const selected = userOptions.find((u) => u.id === userId)
                                                            if (selected) {
                                                                setValue(`${key}.name` as const, selected.name, { shouldValidate: true })
                                                                setValue(`${key}.email` as const, selected.email)
                                                            } else {
                                                                setValue(`${key}.name` as const, "", { shouldValidate: true })
                                                                setValue(`${key}.email` as const, "")
                                                            }
                                                            setValue(`${key}.phone` as const, "")
                                                            setValue(`${key}.location` as const, "")
                                                            setModifiedContacts((prev: ModifiedContacts) => ({ ...prev, [detailsTab]: true }))

                                                            void (async () => {
                                                                try {
                                                                    const dto = await fetchUserDetailsFresh(userId)
                                                                    setValue(`${key}.email` as const, contactEmailFromUserDetails(dto))
                                                                    setValue(`${key}.phone` as const, contactPhoneFromUserDetails(dto))
                                                                    setValue(`${key}.location` as const, dto.location?.name ?? "")
                                                                } catch (err) {
                                                                    toast.error(err instanceof Error ? err.message : "Failed to load user details")
                                                                }
                                                            })()
                                                        }}
                                                    >
                                                        <SelectTrigger style={{ height: '57px' }} className="w-full rounded-[8px] border-[#E5E7EB] text-[#111827] focus:ring-1 focus:ring-[#3B82F6] data-[state=open]:border-[#3B82F6]">
                                                            <SelectValue placeholder={`Select Contact Name`} />
                                                        </SelectTrigger>
                                                        <SelectContent position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] bg-white rounded-[8px] shadow-[0_4px_16px_#00000024] p-1 border-[#E5E7EB] z-50">
                                                            {usersQuery.isLoading && (
                                                                <div className="px-3 py-2 text-[13px] text-[#6B7280]">
                                                                    Loading...
                                                                </div>
                                                            )}
                                                            {usersQuery.isError && (
                                                                <div className="px-3 py-2 text-[13px] text-red-600">
                                                                    {usersQuery.error instanceof Error ? usersQuery.error.message : "Failed to load users"}
                                                                </div>
                                                            )}
                                                            {!usersQuery.isLoading && !usersQuery.isError && userOptions.length === 0 && (
                                                                <div className="px-3 py-2 text-[13px] text-[#6B7280]">
                                                                    No users found
                                                                </div>
                                                            )}
                                                            {userOptions.map((u) => (
                                                                <SelectItem 
                                                                    key={u.id} 
                                                                    value={u.id}
                                                                    className="h-[42px] px-3 font-[400] text-[14px] text-[#111827] focus:bg-[#EBF5FF] focus:text-[#111827] cursor-pointer rounded-[6px]"
                                                                >
                                                                    {u.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">Mobile</Label>
                                                    <Input
                                                        readOnly
                                                        placeholder="Enter Mobile"
                                                        {...register(`${DEPARTMENT_CONTACT_FORM_PREFIX[detailsTab]}.phone` as const)}
                                                        className="h-[57px] rounded-[8px] bg-[#F9FAFB] cursor-not-allowed border-[#E5E7EB] text-[#111827] focus-visible:ring-0 focus-visible:ring-offset-0"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">Email</Label>
                                                    <Input
                                                        readOnly
                                                        placeholder="Enter Email"
                                                        {...register(`${DEPARTMENT_CONTACT_FORM_PREFIX[detailsTab]}.email` as const)}
                                                        className="h-[57px] rounded-[8px] bg-[#F9FAFB] cursor-not-allowed border-[#E5E7EB] text-[#111827] focus-visible:ring-0 focus-visible:ring-offset-0"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">Location</Label>
                                                    <Input
                                                        readOnly
                                                        placeholder="Enter Location"
                                                        {...register(`${DEPARTMENT_CONTACT_FORM_PREFIX[detailsTab]}.location` as const)}
                                                        className="h-[57px] rounded-[8px] bg-[#F9FAFB] cursor-not-allowed border-[#E5E7EB] text-[#111827] focus-visible:ring-0 focus-visible:ring-offset-0"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {showSummaryErrors && (
                                    <div className="flex flex-col items-center justify-center gap-[2px] pt-2 text-[14px] font-[500] text-red-500">
                                        {errors.code && <p>Please fill the Code</p>}
                                        {errors.name && <p>Please fill the Department Name</p>}
                                        {(errors.address?.street || errors.address?.city || errors.address?.state) && <p>Please fill the Fields</p>}
                                        {errors.address?.zip && <p>Zip code must be at least 3 digits</p>}
                                    </div>
                                )}

                                <div className="flex justify-end gap-4 pt-8">
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (detailsTab === "address") onAddressSave()
                                            else onContactSave()
                                        }}
                                        className="w-[140px] h-[50px] bg-[#6C5DD3] hover:bg-[#5B4DC5] rounded-[8px] text-[16px] font-[500]"
                                    >
                                        {detailsTab === "address" && !isDepartmentSaved ? "Next" : "Save"}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleExit}
                                        className="w-[140px] h-[50px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px] text-[16px] font-[500]"
                                    >
                                        Exit
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="settings" className="mt-0">
                            <div className="px-8 pb-8">
                                {id && (
                                    <div className="pt-8 space-y-1">
                                        <div className="text-[15px] font-[600] text-[#374151]">
                                            Code: <span className="text-[#6C5DD3]">{currentCode}</span>
                                        </div>
                                        <div className="text-[15px] font-[600] text-[#374151]">
                                            Department Name: <span className="text-[#6C5DD3]">{currentName}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 gap-5 py-8 min-h-[300px]">
                                    {DEPARTMENT_SETTINGS_ROWS
                                        .filter(s => s.key !== 'allowMultiCodes' || canUpdateDepartment)
                                        .map((setting) => (
                                        <div key={setting.key} className="space-y-2">
                                            <div className="flex items-center gap-4">
                                                <Checkbox
                                                    id={setting.key}
                                                    checked={!!settings[setting.key as keyof typeof settings]}
                                                    disabled={
                                                        setting.key === "removeAutoFillEndTime" &&
                                                        settings.removeStartEndTime
                                                    }
                                                    onCheckedChange={(val) => {
                                                        if (
                                                            setting.key === "removeAutoFillEndTime" &&
                                                            settings.removeStartEndTime
                                                        ) {
                                                            return
                                                        }
                                                        const isChecked = !!val
                                                        const fieldPath =
                                                            `settings.${setting.key}` as Path<DepartmentUpsertValues>
                                                        setValue(fieldPath, isChecked)
                                                        if (setting.key === "apportioning" && isChecked) {
                                                            setValue("settings.autoApportioning", true)
                                                        }
                                                    }}
                                                    className="h-[22px] w-[22px] data-[state=checked]:bg-[#6C5DD3] data-[state=checked]:border-[#6C5DD3] disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                                <Label
                                                    htmlFor={setting.key}
                                                    className={`text-[16px] font-[400] text-[#374151] ${
                                                        setting.key === "removeAutoFillEndTime" &&
                                                        settings.removeStartEndTime
                                                            ? "cursor-not-allowed opacity-60"
                                                            : ""
                                                    }`}
                                                >
                                                    {setting.label}
                                                </Label>
                                            </div>

                                            {setting.key === "allowMultiCodes" && settings.allowMultiCodes && (
                                                <div className="ml-9 mt-2">
                                                    <div className="relative w-[300px]">
                                                        <div 
                                                            className="flex min-h-[44px] w-full items-center gap-1 rounded-[10px] border border-[#D1D5DB] bg-white px-3 py-1 cursor-pointer"
                                                            onClick={() => setIsMultiCodesOpen(!isMultiCodesOpen)}
                                                        >
                                                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                                                {(() => {
                                                                    const selected = (settings.multiCodes || "").split(",").filter(Boolean);
                                                                    return selected.length > 0 ? selected.map((code) => (
                                                                        <span
                                                                            key={code}
                                                                            className="inline-flex items-center gap-1 rounded-[6px] bg-[#F3F4F6] px-2 py-1 text-[14px] text-[#111827]"
                                                                        >
                                                                            <span className="truncate">{code}</span>
                                                                            <button
                                                                                type="button"
                                                                                className="text-[#9CA3AF] hover:text-[#6C5DD3]"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    const current = (settings.multiCodes || "").split(",")
                                                                                    const next = current.filter(c => c !== code).join(",")
                                                                                    setValue("settings.multiCodes", next)
                                                                                }}
                                                                            >
                                                                                <X className="size-3.5" />
                                                                            </button>
                                                                        </span>
                                                                    )) : (
                                                                        <span className="text-[#9CA3AF] text-[14px]">Select multi codes</span>
                                                                    )
                                                                })()}
                                                            </div>
                                                            <div className="flex items-center gap-2 border-l border-[#E5E7EB] pl-2">
                                                                <Search className="size-4 text-[#C4C4C4]" />
                                                                <ChevronDown className={`size-4 text-[#9CA3AF] transition-transform ${isMultiCodesOpen ? 'rotate-180' : ''}`} />
                                                            </div>
                                                        </div>

                                                        {isMultiCodesOpen && (
                                                            <div className="absolute top-[calc(100%+4px)] z-50 w-full rounded-[14px] border border-[#E5E7EB] bg-white p-2 shadow-[0_8px_24px_#0000001A]">
                                                                <div className="mb-2 px-2 py-1">
                                                                    <div className="relative">
                                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]" />
                                                                        <Input 
                                                                            className="h-9 pl-9 text-[14px] focus-visible:ring-0 focus-visible:ring-offset-0 border-[#E5E7EB] rounded-[8px]"
                                                                            placeholder="Search..."
                                                                            value={multiCodesSearch}
                                                                            onChange={(e) => setMultiCodesSearch(e.target.value)}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="max-h-[200px] overflow-auto space-y-1">
                                                                    {masterCodesQuery.isError && masterCodesErrorMessage && (
                                                                        <div className="px-3 py-2 text-[13px] text-red-600">
                                                                            {masterCodesErrorMessage}
                                                                        </div>
                                                                    )}
                                                                    {isLoadingMasterCodes && (
                                                                        <div className="px-3 py-2 text-[13px] text-[#6B7280]">
                                                                            Loading...
                                                                        </div>
                                                                    )}
                                                                    {!isLoadingMasterCodes && !masterCodesQuery.isError && masterCodeOptions.length === 0 && (
                                                                        <div className="px-3 py-2 text-[13px] text-[#6B7280]">
                                                                            No master codes found
                                                                        </div>
                                                                    )}
                                                                    {(isLoadingMasterCodes ? [] : masterCodeOptions)
                                                                        .filter(opt => opt.toLowerCase().includes(multiCodesSearch.toLowerCase()))
                                                                        .map((opt) => {
                                                                            const isSelected = (settings.multiCodes || "").split(",").includes(opt)
                                                                            return (
                                                                                <button
                                                                                    key={opt}
                                                                                    type="button"
                                                                                    className="flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-[14px] hover:bg-[#F3F4F6]"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        const current = settings.multiCodes ? settings.multiCodes.split(",") : []
                                                                                        let next: string[]
                                                                                        if (isSelected) {
                                                                                            next = current.filter(c => c !== opt)
                                                                                        } else {
                                                                                            next = [...current, opt]
                                                                                        }
                                                                                        setValue("settings.multiCodes", next.join(","))
                                                                                    }}
                                                                                >
                                                                                    <span className={isSelected ? "font-[500] text-[#6C5DD3]" : ""}>{opt}</span>
                                                                                    {isSelected && <Check className="size-4 text-[#6C5DD3]" />}
                                                                                </button>
                                                                            )
                                                                        })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end gap-4 pt-10">
                                    <Button
                                        type="button"
                                        onClick={async () => {
                                            const isValid = await trigger([
                                                "code", "name", "address.street", "address.city", "address.state", "address.zip"
                                            ])
                                            if (isValid) {
                                                setShowCreateConfirm(true)
                                            } else {
                                                setActiveTab("details")
                                                setShowSummaryErrors(true)
                                            }
                                        }}
                                        className="w-[140px] h-[50px] bg-[#6C5DD3] hover:bg-[#5B4DC5] rounded-[8px] text-[16px] font-[500]"
                                    >
                                        Save
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleExit}
                                        className="w-[140px] h-[50px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px] text-[16px] font-[500]"
                                    >
                                        Exit
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </form>
            </DialogContent>
        </Dialog>
        <Dialog open={showCreateConfirm} onOpenChange={setShowCreateConfirm}>
            <DialogContent className="max-w-[440px] p-6 rounded-[12px] bg-white border-0 shadow-lg">
                <DialogTitle className="text-[16px] font-[600] text-[#111827]">
                    Create Department
                </DialogTitle>
                <div className="text-[14px] text-[#374151] mt-2 leading-relaxed">
                    Are you sure do you want to create a department with<br />
                    code: {currentCode}<br />
                    name: {currentName} ?
                </div>
                <div className="flex justify-center gap-4 mt-6">
                    <Button
                        type="button"
                        onClick={() => setShowCreateConfirm(false)}
                        className="w-[100px] h-[40px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px]"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleActualSave}
                        className="w-[100px] h-[40px] bg-[#6C5DD3] hover:bg-[#5B4DC5] text-white rounded-[8px]"
                    >
                        OK
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={showSaveContactConfirm} onOpenChange={(open) => {
            setShowSaveContactConfirm(open)
            if (!open) setPendingTabChange(null)
        }}>
            <DialogContent className="max-w-[440px] p-6 rounded-[12px] bg-white border-0 shadow-lg">
                <DialogTitle className="sr-only">Confirm Save</DialogTitle>
                <div className="text-center text-[15px] text-[#111827] mt-2 font-[500]">
                    You have modified on {detailsTab.charAt(0).toUpperCase() + detailsTab.slice(1)} Contact do you want to save it?
                </div>
                <div className="flex justify-center gap-4 mt-6">
                    <Button
                        type="button"
                        onClick={() => {
                            setShowSaveContactConfirm(false)
                            setPendingTabChange(null)
                        }}
                        className="w-[100px] h-[40px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px]"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirmContactSave}
                        className="w-[100px] h-[40px] bg-[#6C5DD3] hover:bg-[#5B4DC5] text-white rounded-[8px]"
                    >
                        OK
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
        </>
    )
}
