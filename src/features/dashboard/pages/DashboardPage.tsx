import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { ArrowLeft, History } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

import { PersonalTimeStudyCard } from "../components/PersonalTimeStudyCard"
import { PersonalLeaveCard } from "../components/PersonalLeaveCard"
import { TimeStudyStatusCard } from "../components/TimeStudyStatusCard"
import { TodoCard } from "../components/TodoCard"
import { UsersCard } from "../components/UsersCard"
import { HolidayListCard } from "../components/HolidayListCard"
import { PayrollManagementCard } from "../components/PayrollManagementCard"
import { ReportsCard } from "../components/ReportsCard"
import { StaffStatsCard } from "../components/StaffStatsCard"
import { UserDashboard } from "../components/UserDashboard"
import { useMimicSession } from "@/features/user/user-mimic"
import { AuditHistoryTable } from "../components/AuditHistoryTable"
import { TitleCaseInput } from "@/components/ui/title-case-input"

import {
  useDashboardOverview,
  useReportsByRole,
} from "../queries/dashboardQueries"
import { downloadPayrollTemplate } from "@/features/payroll/api/payrollApi"
import { getPayrollDateRange } from "../api/dashboard"


import { PayrollPeriod } from "../enums/dashboard.enum"

function hasPermission(permissions: string[] | undefined, key: string): boolean {
  if (!permissions) return false
  return permissions.includes(key) || permissions.includes("superadmin:all")
}

function isDepartmentAdminLikeRole(normalizedRoleName: string): boolean {
  if (!normalizedRoleName) return false

  const knownExactRoleNames = new Set([
    "departmentadmin",
    "departmentadministrator",
    "deptadmin",
    "timestudysupervisor",
    "timestudyadmin",
    "timestudyadministrator",
  ])

  if (knownExactRoleNames.has(normalizedRoleName)) return true

  const isDepartmentAdminByKeywords =
    normalizedRoleName.includes("department") && normalizedRoleName.includes("admin")
  const isTimeStudyAdminByKeywords =
    normalizedRoleName.includes("timestudy") &&
    (normalizedRoleName.includes("admin") || normalizedRoleName.includes("supervisor"))

  return isDepartmentAdminByKeywords || isTimeStudyAdminByKeywords
}

export function DashboardPage() {
  const [showAuditHistory, setShowAuditHistory] = useState(false)
  const [auditSearch, setAuditSearch] = useState("")
  const { user } = useAuth()
  const { data: mimicSession } = useMimicSession()
  const userId = user?.id ?? ""
  const permissions = user?.permissions

  const deptRoles = user?.departmentRoles ?? []
  const normalizeRoleName = (role: string) => (role ?? "").trim().toLowerCase().replace(/[^a-z]/g, "")
  const normalizedRoleNames = [
    ...deptRoles.map((dr) => normalizeRoleName(dr.roleName)),
    ...(user?.roles ?? []).map((role) => normalizeRoleName(role)),
  ].filter((role) => role.length > 0)
  const hasSuperAdminRole = normalizedRoleNames.some((role) => role === "superadmin")
  const hasPayrollAdminRole = normalizedRoleNames.some(
    (role) => role === "payrolladmin" || role === "payroll"
  )
  const hasDeptTsRole = normalizedRoleNames.some(isDepartmentAdminLikeRole)
  const hasDepartmentAndPayrollRole = hasDeptTsRole && hasPayrollAdminRole
  const hasUserRole = normalizedRoleNames.some((role) => role === "user")
  const isUserOrPayrollRole = (role: string) =>
    role === "user" || role === "payroll" || role === "payrolladmin"
  const hasOnlyUserPayrollRoleMix =
    normalizedRoleNames.length > 0 && normalizedRoleNames.every((role) => isUserOrPayrollRole(role))
  const hasMultipleDepartmentRoles = deptRoles.length > 1
  const shouldUseAdminDashboardForRoleMix =
    hasDeptTsRole || (hasMultipleDepartmentRoles && !hasOnlyUserPayrollRoleMix)
  const isSuperAdmin = mimicSession
    ? hasSuperAdminRole
    : hasSuperAdminRole || hasPermission(permissions, "superadmin:all")
  const canAddPayroll = hasPermission(permissions, "payroll:add")
  const canCreateUser =
    hasPermission(permissions, "user:create") || hasPermission(permissions, "user:add")

  const isPayrollAdmin = mimicSession
    ? hasPayrollAdminRole && !isSuperAdmin && !shouldUseAdminDashboardForRoleMix
    : canAddPayroll && !isSuperAdmin && !shouldUseAdminDashboardForRoleMix
  const isDeptOrTSAdmin = mimicSession
    ? !isSuperAdmin && !isPayrollAdmin && shouldUseAdminDashboardForRoleMix
    : !isSuperAdmin && !isPayrollAdmin && shouldUseAdminDashboardForRoleMix
  const isRegularUser = !isSuperAdmin && !isPayrollAdmin && !isDeptOrTSAdmin
  const shouldTreatPayrollRoleMixAsSuperAdmin =
    hasPayrollAdminRole && (hasDeptTsRole || hasUserRole) && !isSuperAdmin
  const isUserLikeDashboard =
    hasOnlyUserPayrollRoleMix || isRegularUser || isPayrollAdmin
  const canViewAdminLayout = !isUserLikeDashboard
  const isSuperAdminLikeDashboard = isSuperAdmin
  const shouldShowExtendedStats = isSuperAdmin || hasDepartmentAndPayrollRole || shouldTreatPayrollRoleMixAsSuperAdmin
  const canAlwaysViewUserCard = hasDeptTsRole
  const showUserManagement = isSuperAdmin || canCreateUser || canAlwaysViewUserCard
  const showPayrollCard = isSuperAdmin || hasPayrollAdminRole
  const showStaffStatsCard = isSuperAdmin || isPayrollAdmin || isDeptOrTSAdmin
  const row2TemplateColumns = showPayrollCard
    ? "0.90fr 1.10fr 1.23fr 0.81fr"
    : showStaffStatsCard
      ? "0.90fr 1.23fr 0.81fr"
      : "0.90fr 1.23fr"


  const payrollType = PayrollPeriod.Monthly
  const { label: periodLabel } = getPayrollDateRange(payrollType)

  const selectedDeptRoleIdx = "0"

  const currentDeptRole = deptRoles[Number(selectedDeptRoleIdx)]
  const departmentId = currentDeptRole?.departmentId
  const roleId = currentDeptRole?.roleId

  const overview = useDashboardOverview({ 
    userId,
    departmentId: isSuperAdminLikeDashboard ? undefined : departmentId, 
    roleId: isSuperAdminLikeDashboard ? undefined : roleId, 
    enabled: canViewAdminLayout 
  })
  const reports = useReportsByRole({ 
    departmentId, 
    roleId,
    enabled: canViewAdminLayout,
  })
  
  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadPayrollTemplate()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "payroll_template.xlsx")
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download payroll template:", error)
    }
  }

  
  const {
    totalUserCount: overviewUserCount = 0,
    totalActiveUserCount: overviewActiveUserCount = 0,
    totalDepartmentCount: deptCountVal = 0,              // User's assigned departments
    totalTimeStudyProgramCount: programCountVal = 0,     // Programs in user's departments
    totalJobPoolCount: jobPoolsVal = 0,                  // Tenant-level
    totalCostPoolCount: costPoolsVal = 0,                // Tenant-level
    totalActivityCount: masterActivityCountVal = 0,      // Tenant-level master activities
    totalActivityDepartmentCount: activityCountVal = 0,  // Activities in user's departments
  } = overview.data ?? {}

  const userCountVal = overviewUserCount
  const activeUsersVal = overviewActiveUserCount

  const tsApproved = overview.data?.timeStudyRecordByUserStatusCounts?.find((s: any) => s.status === 'approved')?.count ?? 0
  const tsSubmitted = overview.data?.timeStudyRecordByUserStatusCounts?.find((s: any) => s.status === 'submitted')?.count ?? 0
  const tsReqMins = 480 * 22
  const tsPercent = tsReqMins > 0 ? ((tsApproved / tsReqMins) * 100).toFixed(2) : "0.00"

  const trApproved = isSuperAdminLikeDashboard
    ? (overview.data?.timeStudyRecordStatusCounts?.find((s: any) => s.status === 'approved')?.count ?? 0)
    : tsApproved

  const trPending = isSuperAdminLikeDashboard
    ? (overview.data?.timeStudyRecordStatusCounts?.find((s: any) => s.status === 'submitted')?.count ?? 0)
    : tsSubmitted

  const trNotSubmitted = isSuperAdminLikeDashboard
    ? (overview.data?.timeStudyRecordStatusCounts?.find((s: any) => s.status === 'draft')?.count ?? 0)
    : (overview.data?.timeStudyRecordByUserStatusCounts?.find((s: any) => s.status === 'draft')?.count ?? 0)

  const selfLeaveTotal = overview.data?.personalLeaveTotal ?? 0
  
  const getPersonalLeaveCount = (statusName: string) => 
    overview.data?.personalLeaveStatusCounts?.find((s: any) => s.status.toLowerCase() === statusName)?.count ?? 0
  
  const selfLeaveApproved = getPersonalLeaveCount('approved')
  const selfLeaveOpen = getPersonalLeaveCount('requested') || getPersonalLeaveCount('draft')
  const selfLeaveRejected = getPersonalLeaveCount('rejected')

  const getStaffLeaveCount = (statusName: string) =>
    overview.data?.staffLeaveStatusCounts?.find((s: any) => s.status.toLowerCase() === statusName)?.count ?? 0

  const staffLeaveOpen = getStaffLeaveCount('requested') || getStaffLeaveCount('draft')
  const staffLeaveApproved = getStaffLeaveCount('approved')
  const staffLeaveRejected = getStaffLeaveCount('rejected')

  const holidaysList = overview.data?.holidayList ?? []
  
  const parseDate = (dStr: string) => {
    const t = dStr.trim()
    let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t)
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    m = /^(\d{2})-(\d{2})-(\d{4})/.exec(t)
    if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]))
    return new Date(t)
  }

  const upcomingHolidays = [...holidaysList]
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
    .filter((h) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return parseDate(h.date).getTime() >= today.getTime()
    })

  let nextHolidayMonth = ""
  let nextHolidayDay = "0"
  if (upcomingHolidays.length > 0) {
    const nextDate = parseDate(upcomingHolidays[0].date)
    nextHolidayMonth = nextDate.toLocaleString("en-US", { month: "long" })
    nextHolidayDay = nextDate.getDate().toString()
  }

  const todoItems = overview.data?.todoList ?? []
  const reportsData = reports.data ?? []


  if (overview.isLoading) {
    return (
      <div className="flex min-h-[400px] flex-1 items-center justify-center">
        <Spinner className="size-8 text-[#6C5DD3]" />
      </div>
    )
  }

  if (isUserLikeDashboard) {
    return <UserDashboard />
  }

  return (
    <div className="flex flex-col gap-4 w-full min-h-0">
      {/* Header / Toolbar */}
      {isSuperAdmin && (
        <div className="flex items-center justify-between mb-2 gap-3">
          {showAuditHistory ? (
            <TitleCaseInput
              placeholder="Search Entity Name"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="h-10 w-[270px] rounded-[10px] border border-[#D9D9D9] bg-white px-3.5 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
            />
          ) : (
            <div className="flex-1" />
          )}
          <button
            type="button"
            className={`flex h-10 items-center gap-2 rounded-[8px] px-4 text-[13px] font-medium transition-colors ${
              showAuditHistory
                ? "bg-[#6C5DD3] text-white"
                : "border border-[#6C5DD3] bg-white text-[#6C5DD3] hover:bg-[#F3F0FF]"
            }`}
            onClick={() => {
              setShowAuditHistory((prev) => {
                if (prev) setAuditSearch("")
                return !prev
              })
            }}
          >
            {showAuditHistory ? (
              <>
                <ArrowLeft className="size-4 animate-back-bounce" />
                Back to Dashboard
              </>
            ) : (
              <>
                <History className="size-4" />
                Audit History
              </>
            )}
          </button>
        </div>
      )}

      {showAuditHistory ? (
        <div className="bg-white p-6 rounded-[10px] border border-[#e6e7ef] shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <AuditHistoryTable entityName={auditSearch} />
        </div>
      ) : (
        <>
          <div
            className="grid gap-4 h-[250px]"
            style={{ gridTemplateColumns: "0.86fr 0.7fr 1.24fr 1.2fr" }}
          >

        <div className="h-full overflow-hidden">
          <PersonalTimeStudyCard
            totalApproved={tsApproved}
            totalSubmitted={tsSubmitted}
            percent={tsPercent}
            periodLabel={periodLabel}
            isLoading={overview.isLoading}
          />
        </div>


        <div className="h-full overflow-hidden">
          <PersonalLeaveCard
            total={selfLeaveTotal}
            approved={selfLeaveApproved}
            open={selfLeaveOpen}
            rejected={selfLeaveRejected}
            nextHolidayMonth={nextHolidayMonth}
            nextHolidayDay={nextHolidayDay}
            isLoading={overview.isLoading}
          />
        </div>

        {/* Time Study Status */}
        <div className="h-full overflow-hidden">
          <TimeStudyStatusCard
            approved={trApproved}
            pendingApproval={trPending}
            notSubmitted={trNotSubmitted}
            isLoading={overview.isLoading}
          />
        </div>


        <div className="h-full overflow-hidden">
          <TodoCard items={todoItems} isLoading={overview.isLoading} />
        </div>
      </div>

      {/* ── Row 2: h-[285px] ── */}
      <div className="grid gap-4 h-[285px]" style={{ gridTemplateColumns: row2TemplateColumns }}>


        {showUserManagement ? (
          <div className="flex flex-col gap-3 h-full min-h-0">
            <UsersCard
              userCount={userCountVal}
                activeUsers={shouldShowExtendedStats ? activeUsersVal : undefined}
                showActiveUsers={shouldShowExtendedStats}
                isLoading={overview.isLoading}
            />
            <div className="flex-1 min-h-0">
              <HolidayListCard list={holidaysList} isLoading={overview.isLoading} />
            </div>
          </div>
        ) : (
          <div className="h-full min-h-0 overflow-hidden">
            <HolidayListCard list={holidaysList} isLoading={overview.isLoading} />
          </div>
        )}

        {/* Payroll Management */}
        {showPayrollCard && (
          <PayrollManagementCard 
            canViewPayroll 
            onDownloadTemplate={handleDownloadTemplate} 
          />
        )}

        {/* Reports */}
        <div className="h-full overflow-hidden min-h-0">
          <ReportsCard reports={reportsData} isLoading={reports.isLoading} />
        </div>

        {/* Staff Leave + Stats */}
        {showStaffStatsCard && (
          <StaffStatsCard
            open={staffLeaveOpen}
            approved={staffLeaveApproved}
            rejected={staffLeaveRejected}
            deptCount={deptCountVal}
            programCount={programCountVal}
            activitiesCount={isSuperAdmin ? masterActivityCountVal : activityCountVal}
            jobPools={shouldShowExtendedStats ? jobPoolsVal : undefined}
            costPools={shouldShowExtendedStats ? costPoolsVal : undefined}
            isLoading={overview.isLoading}
          />
        )}
      </div>
    </>
  )}
</div>
)
}


export default DashboardPage

