import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { ArrowLeft, History } from "lucide-react"

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
  useSelfLeave,
  useStaffLeave,
  useTodos,
  useHolidays,
  useDashboardOverview,
  useReportsByRole,
  useDashboardUserCount,
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
  const normalizeRoleName = (role: string) => role.trim().toLowerCase().replace(/[^a-z]/g, "")
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

  const selfLeave = useSelfLeave(userId)
  const staffLeave = useStaffLeave({ 
    userId: userId,
    enabled: canViewAdminLayout 
  })
  const todos = useTodos(userId)
  const holidays = useHolidays()
  const overview = useDashboardOverview({ 
    userId,
    departmentId: isSuperAdminLikeDashboard ? undefined : departmentId, 
    roleId: isSuperAdminLikeDashboard ? undefined : roleId, 
    enabled: canViewAdminLayout 
  })
  const dashboardUserCount = useDashboardUserCount({ enabled: showUserManagement })
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

  const userCountVal = overviewUserCount ?? dashboardUserCount.data ?? 0
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

  const selfLeaveTotal = selfLeave.data?.total ?? 0
  const selfLeaveApproved = selfLeave.data?.approved ?? 0
  const selfLeaveOpen = selfLeave.data?.requested ?? 0
  const selfLeaveRejected = selfLeave.data?.rejected ?? 0

  const staffLeaveOpen = staffLeave.data?.requested ?? 0
  const staffLeaveApproved = staffLeave.data?.approved ?? 0
  const staffLeaveRejected = staffLeave.data?.rejected ?? 0


  const nextHolidayMonth = holidays.data?.nextMonth ?? ""
  const nextHolidayDay = holidays.data?.nextDay ?? "0"

  const todoItems = todos.data ?? []
  const reportsData = reports.data ?? []


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
            isLoading={selfLeave.isLoading || holidays.isLoading}
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
          <TodoCard items={todoItems} isLoading={todos.isLoading} />
        </div>
      </div>

      {/* ── Row 2: h-[285px] ── */}
      <div className="grid gap-4 h-[285px]" style={{ gridTemplateColumns: row2TemplateColumns }}>


        {showUserManagement ? (
          <div className="flex flex-col gap-3">
            <UsersCard
              userCount={userCountVal}
                activeUsers={shouldShowExtendedStats ? activeUsersVal : undefined}
                showActiveUsers={shouldShowExtendedStats}
                isLoading={
                  shouldShowExtendedStats
                    ? dashboardUserCount.isLoading || overview.isLoading
                    : dashboardUserCount.isLoading || overview.isLoading
                }
            />
            <div className="flex-1 min-h-0">
              <HolidayListCard />
            </div>
          </div>
        ) : (
          <div className="h-full min-h-0 overflow-hidden">
            <HolidayListCard />
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
            isLoading={staffLeave.isLoading || overview.isLoading}
          />
        )}
      </div>
    </>
  )}
</div>
)
}

