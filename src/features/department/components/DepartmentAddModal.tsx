import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
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
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, CheckCircle2, History } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/usePermissions"
import { guardNoChanges } from "@/lib/formGuard"
import { useCreateDepartment } from "../mutations/createDepartment"
import { useUpdateDepartment } from "../mutations/updateDepartment"
import { useGetDepartmentById } from "../queries/getDepartmentById"

import { useDepartmentReportSettingsTabQueries } from "../hooks/useDepartmentReportSettingsTabQueries"
import { departmentKeys } from "../keys"
import { queryClient } from "@/main"
import { apiGetUserDetails } from "@/features/user/api"
import type { UserDetailsDto } from "@/features/user/types"
import type { DepartmentContactUser } from "../queries/getDepartmentUsers"
import { useGetDepartmentUsers } from "../queries/getDepartmentUsers"
import { DepartmentHistoryTable } from "./DepartmentHistoryTable"
import { DepartmentReportSettingsPanel } from "./DepartmentReportSettingsPanel"
import { DepartmentSettingsPanel } from "./DepartmentSettingsPanel"
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
    const [showDepartmentHistory, setShowDepartmentHistory] = useState(false)
    const [showInactiveConfirm, setShowInactiveConfirm] = useState(false)
    const [showSaveContactConfirm, setShowSaveContactConfirm] = useState(false)
    const [pendingTabChange, setPendingTabChange] = useState<PendingTabChange | null>(null)
    const [modifiedContacts, setModifiedContacts] = useState<ModifiedContacts>({
        address: false, primary: false, secondary: false, billing: false
    })

    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)

    const { canUpdate: hasUpdatePerm, isDepartmentAdmin, isSuperAdmin } = usePermissions()
    const canUpdateDepartment = hasUpdatePerm("department")

    const usersQuery = useGetDepartmentUsers(isUserDropdownOpen)
    const userOptions = usersQuery.data ?? []

    const departmentQuery = useGetDepartmentById(departmentId)
    const existingDept = departmentQuery.data
    const isLoadingDept = departmentQuery.isLoading



    const valuesFromDepartmentQuery = useMemo((): DepartmentUpsertValues | undefined => {
        if (!departmentId || !existingDept) return undefined
        return buildDepartmentUpsertFormValues(existingDept, userOptions)
    }, [departmentId, existingDept, userOptions])

    const createDeptMutation = useCreateDepartment()
    const updateDeptMutation = useUpdateDepartment()
    const isSubmitting = createDeptMutation.isPending || updateDeptMutation.isPending

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
    const historyDepartmentId = (id ?? departmentId ?? "").trim()
    const primaryContactId = watch("primaryContactId")
    const secondaryContactId = watch("secondaryContactId")
    const billingContactId = watch("billingContactId")
    const primaryContactName = watch("primaryContact.name")
    const secondaryContactName = watch("secondaryContact.name")
    const billingContactName = watch("billingContact.name")

    const renderedOptions = useMemo(() => {
        const list = [...userOptions]
        const currentId =
            detailsTab === "primary"
                ? primaryContactId
                : detailsTab === "secondary"
                    ? secondaryContactId
                    : billingContactId
        const currentName =
            detailsTab === "primary"
                ? primaryContactName
                : detailsTab === "secondary"
                    ? secondaryContactName
                    : billingContactName

        if (currentId?.trim() && currentName?.trim() && !list.some((u) => u.id === currentId.trim())) {
            list.push({
                id: currentId.trim(),
                name: currentName.trim(),
                email: "",
                phone: "",
                location: "",
            })
        }
        return list
    }, [userOptions, detailsTab, primaryContactId, secondaryContactId, billingContactId, primaryContactName, secondaryContactName, billingContactName])

    const isReportSettingsTabActive = activeTab === "reportSettings"
    const {
        reportOptions: departmentReportOptions,
        isReportOptionsLoading: isDepartmentReportOptionsLoading,
        mappedReports: departmentMappedReports,
        isMappedReportsLoading: isDepartmentMappedReportsLoading,
    } = useDepartmentReportSettingsTabQueries(isReportSettingsTabActive, departmentId)

    const handleSave = async (opts?: { toastMode?: "none" | "createOrUpdate" }): Promise<string | null> => {
        if (createDeptMutation.isPending || updateDeptMutation.isPending) return null
        const toastMode = opts?.toastMode ?? "createOrUpdate"

        const values = getValues()
        if (values.settings.allowMultiCodes) {
            const selectedCodes = (values.settings.multiCodes || "").split(",").filter(Boolean)
            if (selectedCodes.length === 0) {
                toast.error("Please select at least one multi-code when Allow MultiCodes is enabled.")
                return null
            }
        }
        if (departmentId) {
            try {
                const reference = valuesFromDepartmentQuery ?? DEPARTMENT_FORM_DEFAULT_VALUES
                if (guardNoChanges(values, reference)) {
                    return null
                }
                await updateDeptMutation.mutateAsync({
                    id: departmentId,
                    values,
                    referenceValues: reference,
                    addressChanged: modifiedContacts.address,
                })
                const referenceActive = reference.active !== undefined ? reference.active : true
                const statusChanged = referenceActive !== values.active
                if (toastMode === "createOrUpdate" || statusChanged) {
                    const toastMsg = statusChanged
                        ? values.active
                            ? "Department Activated Successfully"
                            : "Department Deactivated Successfully"
                        : "Department Updated Successfully"

                    toast(
                        <div className="flex items-center gap-2 text-[14px]">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            {toastMsg}
                        </div>
                    )
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to update department")
                return null
            }
            return departmentId
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
            return nextId
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to create department"
            toast.error(message)
            if (message.toLowerCase().includes("code already exists")) {
                setError("code", { type: "manual", message })
            }
            return null
        }
    }

    const handleActualSave = async () => {
        setShowCreateConfirm(false)
        const savedDeptId = await handleSave()
        if (!savedDeptId) return
        setActiveTab("details")
        setDetailsTab("primary")
    }

    /** Exit always discards without calling the API. Persist only via Save / OK on create confirm / contact Save when a row exists. */
    const handleExit = () => {
        void queryClient.invalidateQueries({ queryKey: ["departments", "table-all"] })
        void queryClient.invalidateQueries({ queryKey: ["departments", "list"] })
        void queryClient.invalidateQueries({ queryKey: ["departments", "all-unpaginated"] })
        onClose()
    }

    const onSubmit = (_data: DepartmentUpsertValues) => {
        // If we're on the settings or report settings tab and submitting the main form
        if (activeTab === "settings" || activeTab === "reportSettings") {
            const values = getValues()
            if (values.settings.allowMultiCodes) {
                const selectedCodes = (values.settings.multiCodes || "").split(",").filter(Boolean)
                if (selectedCodes.length === 0) {
                    toast.error("Please select at least one multi-code when Allow MultiCodes is enabled.")
                    return
                }
            }
            if (id) {
                void handleSave()
            } else {
                setShowCreateConfirm(true)
            }
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

        const reference = valuesFromDepartmentQuery ?? DEPARTMENT_FORM_DEFAULT_VALUES
        const values = getValues()
        const referenceActive = reference.active !== undefined ? reference.active : true
        const statusChanged = referenceActive !== values.active

        if (departmentId) {
            const savedDeptId = await handleSave({ toastMode: "none" })
            if (!savedDeptId) return
        }

        const titleCaseTab = detailsTab.charAt(0).toUpperCase() + detailsTab.slice(1)
        const contactToastMessage =
            departmentId != null
                ? `${titleCaseTab} contact ${id ? "updated" : "saved"} successfully`
                : `${titleCaseTab} contact step completed (not saved until you create the department)`
        if (!statusChanged) {
            toast(
                <div className="flex items-center gap-2 text-[14px]">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {contactToastMessage}
                </div>
            )
        }
        setModifiedContacts((prev: ModifiedContacts) => ({ ...prev, [detailsTab]: false }))

        if (detailsTab === "primary") setDetailsTab("secondary")
        else if (detailsTab === "secondary") setDetailsTab("billing")
    }

    const onAddressSave = async () => {
        const isValid = await validateDetailsTab()
        if (!isValid) return

        const reference = valuesFromDepartmentQuery ?? DEPARTMENT_FORM_DEFAULT_VALUES
        const values = getValues()
        const referenceActive = reference.active !== undefined ? reference.active : true
        const statusChanged = referenceActive !== values.active

        const hasExistingDepartment = id != null || departmentId != null
        if (hasExistingDepartment) {
            const savedDeptId = await handleSave({ toastMode: "none" })
            if (!savedDeptId) return
            if (!statusChanged) {
                toast(
                    <div className="flex items-center gap-2 text-[14px]">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Address updated successfully
                    </div>
                )
            }
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

    const handleSettingsSave = async () => {
        const isValid = await validateDetailsTab()
        if (!isValid) {
            setActiveTab("details")
            return
        }
        const values = getValues()
        if (values.settings.allowMultiCodes) {
            const selectedCodes = (values.settings.multiCodes || "").split(",").filter(Boolean)
            if (selectedCodes.length === 0) {
                toast.error("Please select at least one multi-code when Allow MultiCodes is enabled.")
                return
            }
        }
        if (id) {
            void handleSave()
        } else {
            setShowCreateConfirm(true)
        }
    }

    const ensureDepartmentIdForReportMapping = async (): Promise<string | null> => {
        const isValid = await validateDetailsTab()
        if (!isValid) {
            setActiveTab("details")
            return null
        }
        if (departmentId) return departmentId
        return handleSave({ toastMode: "none" })
    }

    const handleTabChange: HandleTabChange = async (value) => {
        if (detailsTab !== "address" && modifiedContacts[detailsTab]) {
            setPendingTabChange({ type: 'active', value: value as ActiveTab })
            setShowSaveContactConfirm(true)
            return
        }

        if (value === "settings" || value === "reportSettings") {
            const isValid = await validateDetailsTab()
            if (!isValid) return
        }
        if (value === "details" && (departmentId != null || isDepartmentSaved)) {
            // Edit mode or unsaved create mode should land on Address first.
            // Only after successful creation (departmentId set in create flow) do we land on Primary.
            setDetailsTab((id || !departmentId) ? "address" : "primary")
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
                <DialogContent className="w-[95vw] sm:max-w-[893px] p-0 max-h-[90vh] overflow-y-auto border-none shadow-2xl rounded-[12px] bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {historyDepartmentId && isSuperAdmin ? (
                        <button
                            type="button"
                            className="absolute right-12 top-4 z-10 cursor-pointer rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onClick={() => setShowDepartmentHistory(true)}
                            aria-label="View department history"
                        >
                            <History className="h-4 w-4" />
                        </button>
                    ) : null}
                    <DialogHeader className="bg-white px-6 py-4 text-center">
                        <DialogTitle className="text-center text-[22px] font-[600] text-[#111827]">
                            {id ? "Edit Department" : "Add Department"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                        {isSubmitting && (
                            <div className="absolute inset-0 z-[100] flex items-center justify-center rounded-b-[12px] bg-white/60">
                                <Spinner className="text-[#6C5DD3]" />
                            </div>
                        )}
                        {(id && (departmentQuery.isFetching || !existingDept)) ? (
                            <div className="flex h-[400px] items-center justify-center">
                                <Spinner className="text-[#6C5DD3]" />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                    <div className="px-6 py-4">
                                        <TabsList className="flex flex-col sm:grid sm:grid-cols-3 !h-auto sm:!h-[62px] w-full items-stretch gap-0 overflow-hidden rounded-[6px] border border-[#E5E7EB] bg-white p-0">
                                            <TabsTrigger
                                                value="details"
                                                className="!h-[54px] sm:!h-full rounded-[8px] border-0 data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white data-[state=inactive]:text-[#9CA3AF] font-[500] text-[15px] transition-all shadow-none"
                                            >
                                                Department Details
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="settings"
                                                disabled={isLoadingDept}
                                                className="!h-[54px] sm:!h-full rounded-[8px] border-0 data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white data-[state=inactive]:text-[#9CA3AF] font-[500] text-[15px] transition-all shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Department Settings
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="reportSettings"
                                                disabled={isLoadingDept}
                                                className="!h-[54px] sm:!h-full rounded-[8px] border-0 px-2 data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white data-[state=inactive]:text-[#9CA3AF] font-[500] text-[14px] leading-tight transition-all shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Department Report Setting
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <TabsContent value="details" className="mt-0">
                                        <div className="px-6 sm:px-8 pb-8 space-y-6">
                                            {/* Header Row: Code, Name, Active */}
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-4 sm:gap-6 relative">
                                                <div className="w-full sm:w-[180px] space-y-2">
                                                    <Label htmlFor="code" className="text-[13px] font-[500] text-[#374151]">
                                                        *Code
                                                    </Label>
                                                    <TitleCaseInput
                                                        id="code"
                                                        placeholder="Code"
                                                        {...register("code")}
                                                        readOnly={isDepartmentAdmin && !!id}
                                                        className={`h-[57px] rounded-[8px] border-[#E5E7EB] focus:ring-1 focus:ring-[#6C5DD3] ${(isDepartmentAdmin && !!id) ? 'cursor-not-allowed bg-[#F9FAFB]' : ''}`}
                                                    />
                                                    {errors.code && <p className="text-[12px] text-red-500">{errors.code.message}</p>}
                                                </div>
                                                <div className="w-full sm:flex-1 space-y-2">
                                                    <Label htmlFor="name" className="text-[13px] font-[500] text-[#374151]">
                                                        *Department
                                                    </Label>
                                                    <TitleCaseInput
                                                        id="name"
                                                        placeholder="Enter Department"
                                                        {...register("name")}
                                                        readOnly={isDepartmentAdmin && !!id}
                                                        className={`h-[57px] w-full rounded-[8px] border-[#E5E7EB] focus:ring-1 focus:ring-[#6C5DD3] ${(isDepartmentAdmin && !!id) ? 'cursor-not-allowed bg-[#F9FAFB]' : ''}`}
                                                    />
                                                    {errors.name && <p className="text-[12px] text-red-500">{errors.name.message}</p>}
                                                </div>
                                                <div className="pt-2 sm:pt-10 flex items-center gap-2">
                                                    <Checkbox
                                                        id="active"
                                                        checked={active}
                                                        onCheckedChange={(val) => {
                                                            if (active && !val) {
                                                                setShowInactiveConfirm(true)
                                                            } else {
                                                                setValue("active", !!val)
                                                            }
                                                        }}
                                                        className="h-[20px] w-[20px] data-[state=checked]:bg-[#6C5DD3] data-[state=checked]:border-[#6C5DD3]"
                                                    />
                                                    <Label htmlFor="active" className="text-[15px] font-[500] text-[#374151]">Active</Label>
                                                </div>
                                            </div>

                                            {/* Sub-Tabs: Address, Contacts */}
                                            <div className="space-y-6 pt-4">
                                                <div className="flex flex-col sm:flex-row gap-2 p-1 bg-transparent w-full">
                                                    {DETAIL_TABS.map((tab) => (
                                                        <button
                                                            key={tab.id}
                                                            type="button"
                                                            onClick={() => handleDetailsTabChange(tab.id)}
                                                            style={{ "--btn-width": tab.width } as React.CSSProperties}
                                                            className={`h-[60px] rounded-[6px] text-[15px] font-[500] flex items-center justify-center gap-2 transition-all w-full sm:w-[var(--btn-width)] ${detailsTab === tab.id
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
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                                            <div className="space-y-2">
                                                                <Label className="text-[14px] font-[500] text-[#374151]">*Street</Label>
                                                                <TitleCaseInput
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
                                                                <TitleCaseInput
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
                                                                <TitleCaseInput
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
                                                                <TitleCaseInput
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
                                                        <div key={detailsTab} className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                                            <div className="space-y-2">
                                                                <Label className="text-[14px] font-[500] text-[#374151]">
                                                                    {detailsTab.charAt(0).toUpperCase() + detailsTab.slice(1)} Contact Name
                                                                </Label>
                                                                <Select onOpenChange={(open) => { if (open) setIsUserDropdownOpen(true); }}
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
                                                                        const selected = renderedOptions.find((u) => u.id === userId)
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
                                                                        <SelectValue placeholder={id ? "Not Assigned" : "Select Contact Name"} />
                                                                    </SelectTrigger>
                                                                    <SelectContent position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] bg-white rounded-[8px] shadow-[0_4px_16px_#00000024] p-1 border-[#E5E7EB] z-50">
                                                                        {usersQuery.isLoading && (
                                                                            <div className="flex items-center justify-center px-3 py-2">
                                                                                <Spinner className="size-4 text-[#6C5DD3]" />
                                                                            </div>
                                                                        )}
                                                                        {usersQuery.isError && (
                                                                            <div className="px-3 py-2 text-[13px] text-red-600">
                                                                                {usersQuery.error instanceof Error ? usersQuery.error.message : "Failed to load users"}
                                                                            </div>
                                                                        )}
                                                                        {!usersQuery.isLoading && !usersQuery.isError && renderedOptions.length === 0 && (
                                                                            <div className="px-3 py-2 text-[13px] text-[#6B7280]">
                                                                                No users found
                                                                            </div>
                                                                        )}
                                                                        {renderedOptions.map((u) => (
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
                                                                <TitleCaseInput
                                                                    readOnly
                                                                    placeholder="Enter Mobile"
                                                                    {...register(`${DEPARTMENT_CONTACT_FORM_PREFIX[detailsTab]}.phone` as const)}
                                                                    className="h-[57px] rounded-[8px] bg-[#F9FAFB] cursor-not-allowed border-[#E5E7EB] text-[#111827] focus-visible:ring-0 focus-visible:ring-offset-0"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[14px] font-[500] text-[#374151]">Email</Label>
                                                                <TitleCaseInput
                                                                    readOnly
                                                                    placeholder="Enter Email"
                                                                    {...register(`${DEPARTMENT_CONTACT_FORM_PREFIX[detailsTab]}.email` as const)}
                                                                    className="h-[57px] rounded-[8px] bg-[#F9FAFB] cursor-not-allowed border-[#E5E7EB] text-[#111827] focus-visible:ring-0 focus-visible:ring-offset-0"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[14px] font-[500] text-[#374151]">Location</Label>
                                                                <TitleCaseInput
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

                                            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8">
                                                <Button
                                                    type="button"
                                                    disabled={isSubmitting}
                                                    onClick={() => {
                                                        if (detailsTab === "address") onAddressSave()
                                                        else onContactSave()
                                                    }}
                                                    className="w-full sm:w-[140px] h-[50px] bg-[#6C5DD3] hover:bg-[#5B4DC5] rounded-[8px] text-[16px] font-[500]"
                                                >
                                                    {detailsTab === "address" && !departmentId ? "Next" : "Save"}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={handleExit}
                                                    className="w-full sm:w-[140px] h-[50px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px] text-[16px] font-[500]"
                                                >
                                                    Exit
                                                </Button>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="settings" className="mt-0">
                                        <DepartmentSettingsPanel
                                            departmentId={departmentId ?? undefined}
                                            currentCode={currentCode}
                                            currentName={currentName}
                                            settings={settings}
                                            setValue={setValue}
                                            canUpdateDepartment={canUpdateDepartment}
                                            isSubmitting={isSubmitting}
                                            onSave={() => void handleSettingsSave()}
                                            onExit={handleExit}
                                        />
                                    </TabsContent>


                                    <TabsContent value="reportSettings" className="mt-0">
                                        <DepartmentReportSettingsPanel
                                            departmentId={departmentId}
                                            departmentCode={currentCode}
                                            departmentName={currentName}
                                            reportOptions={departmentReportOptions}
                                            mappedReports={departmentMappedReports}
                                            isReportOptionsLoading={isDepartmentReportOptionsLoading}
                                            isMappedReportsLoading={isDepartmentMappedReportsLoading}
                                            isSubmitting={isSubmitting}
                                            onEnsureDepartmentId={ensureDepartmentIdForReportMapping}
                                            onExit={handleExit}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </form>
                        )}
                    </div>
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
                            disabled={isSubmitting}
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

            <Dialog open={showDepartmentHistory} onOpenChange={setShowDepartmentHistory}>
                <DialogContent className="max-h-[92vh] max-w-[980px] overflow-hidden rounded-[12px] border border-[#E5E7EB] p-0 shadow-2xl">
                    <DialogHeader className="border-b border-[#E5E7EB] bg-[#FAFAFC] px-6 py-4 text-left">
                        <DialogTitle className="text-[18px] font-[600] text-[#111827]">
                            Department History
                        </DialogTitle>
                        {currentCode || currentName ? (
                            <p className="text-[13px] text-[#6B7280]">
                                {[currentCode, currentName].filter(Boolean).join(" — ")}
                            </p>
                        ) : null}
                    </DialogHeader>
                    <div className="max-h-[calc(92vh-88px)] overflow-y-auto px-6 py-4">
                        <DepartmentHistoryTable departmentId={historyDepartmentId} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showInactiveConfirm} onOpenChange={setShowInactiveConfirm}>
                <DialogContent className="max-w-[440px] p-6 rounded-[12px] bg-white border-0 shadow-lg">
                    <DialogTitle className="sr-only">Confirm Deactivation</DialogTitle>
                    <div className="text-center text-[15px] text-[#111827] mt-2 font-[500]">
                        Are you sure do you want to change Active to Inactive Department ?
                    </div>
                    <div className="flex justify-center gap-4 mt-6">
                        <Button
                            type="button"
                            onClick={() => setShowInactiveConfirm(false)}
                            className="w-[100px] h-[40px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setValue("active", false)
                                setShowInactiveConfirm(false)
                            }}
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
