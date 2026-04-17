import { useAuth } from "@/contexts/AuthContext"

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

import {
  usePersonalTimeStudy,
  useTimeRecordRequests,
  useSelfLeave,
  useStaffLeave,
  useTodos,
  useHolidays,
  useDashboardOverview,
  useReportsByRole,
  useActiveUsers,
  useDashboardUserCount,
} from "../queries/dashboardQueries"
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
  const isUserOrPayrollRole = (role: string) =>
    role === "user" || role === "payroll" || role === "payrolladmin"
  const hasOnlyUserPayrollRoleMix =
    normalizedRoleNames.length > 0 && normalizedRoleNames.every((role) => isUserOrPayrollRole(role))
  const hasMultipleDepartmentRoles = deptRoles.length > 1
  const shouldUseAdminDashboardForRoleMix =
    hasDeptTsRole || (hasMultipleDepartmentRoles && !hasOnlyUserPayrollRoleMix)
  const isAdmin = mimicSession
    ? hasSuperAdminRole
    : hasSuperAdminRole || hasPermission(permissions, "superadmin:all")
  const canAddPayroll = hasPermission(permissions, "payroll:add")
  const canCreateUser =
    hasPermission(permissions, "user:create") || hasPermission(permissions, "user:add")

  const isPayrollAdmin = mimicSession
    ? hasPayrollAdminRole && !isAdmin && !shouldUseAdminDashboardForRoleMix
    : canAddPayroll && !isAdmin && !shouldUseAdminDashboardForRoleMix
  const isDeptOrTSAdmin = mimicSession
    ? !isAdmin && !isPayrollAdmin && shouldUseAdminDashboardForRoleMix
    : !isAdmin && !isPayrollAdmin && shouldUseAdminDashboardForRoleMix
  const isRegularUser = !isAdmin && !isPayrollAdmin && !isDeptOrTSAdmin
  const hasUserRole = normalizedRoleNames.some((role) => role === "user")
  const shouldTreatPayrollRoleMixAsSuperAdmin =
    hasPayrollAdminRole && (hasDeptTsRole || hasUserRole) && !hasSuperAdminRole
  const isUserLikeDashboard =
    (hasOnlyUserPayrollRoleMix || isRegularUser || isPayrollAdmin) &&
    !shouldTreatPayrollRoleMixAsSuperAdmin
  const canViewAdminLayout = !isUserLikeDashboard
  const isSuperAdminLikeDashboard =
    isAdmin || hasDepartmentAndPayrollRole || shouldTreatPayrollRoleMixAsSuperAdmin
  const canAlwaysViewUserCard = hasDeptTsRole
  const showUserManagement = isSuperAdminLikeDashboard || canCreateUser || canAlwaysViewUserCard
  const showPayrollCard = isSuperAdminLikeDashboard
  const showStaffStatsCard = isAdmin || isPayrollAdmin || isDeptOrTSAdmin
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

  const personalTS = usePersonalTimeStudy({
    userId,
    payrollType,
    reqMins: 480,
    departmentId,
    roleId,
    enabled: canViewAdminLayout,
  })

  const timeRecordRequests = useTimeRecordRequests({ 
    userId, 
    payrollType, 
    departmentId, 
    roleId,
    enabled: canViewAdminLayout,
  })

  const selfLeave = useSelfLeave(userId)
  const staffLeave = useStaffLeave({ 
    userId: isSuperAdminLikeDashboard ? undefined : userId,
    departmentId: isSuperAdminLikeDashboard ? undefined : departmentId, 
    roleId: isSuperAdminLikeDashboard ? undefined : roleId, 
    enabled: canViewAdminLayout 
  })
  const todos = useTodos(userId)
  const holidays = useHolidays()
  const overview = useDashboardOverview({ 
    userId: isSuperAdminLikeDashboard ? undefined : userId,
    departmentId: isSuperAdminLikeDashboard ? undefined : departmentId, 
    roleId: isSuperAdminLikeDashboard ? undefined : roleId, 
    enabled: canViewAdminLayout 
  })
  const dashboardUserCount = useDashboardUserCount({ enabled: showUserManagement })
  const activeUsers = useActiveUsers({ enabled: isSuperAdminLikeDashboard })
  const reports = useReportsByRole({ 
    departmentId, 
    roleId,
    enabled: canViewAdminLayout,
  })

  
  const {
    totalUserCount: overviewUserCount = 0,
    totalDepartmentCount: deptCountVal = 0,
    totalTimeStudyProgramCount: programCountVal = 0,
    totalJobPoolCount: jobPoolsVal = 0,
    totalCostPoolCount: costPoolsVal = 0,
    totalActivityCount: activityCountVal = 0,
  } = overview.data ?? {}

  const userCountVal = dashboardUserCount.data ?? overviewUserCount
  const activeUsersVal = activeUsers.data ?? 0

  const tsApproved = personalTS.data?.approved ?? 0
  const tsSubmitted = personalTS.data?.submitted ?? 0
  const tsReqMins = 480 * 22
  const tsPercent = tsReqMins > 0 ? ((tsApproved / tsReqMins) * 100).toFixed(2) : "0.00"

  const trApproved = timeRecordRequests.data?.approved ?? 0
  const trPending = timeRecordRequests.data?.pendingApproval ?? 0
  const trNotSubmitted = timeRecordRequests.data?.notSubmitted ?? 0

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
            isLoading={personalTS.isLoading}
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
            isLoading={timeRecordRequests.isLoading}
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
                activeUsers={isSuperAdminLikeDashboard ? activeUsersVal : undefined}
                showActiveUsers={isSuperAdminLikeDashboard}
                isLoading={
                  isSuperAdminLikeDashboard
                    ? dashboardUserCount.isLoading || activeUsers.isLoading
                    : dashboardUserCount.isLoading
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
        {showPayrollCard && <PayrollManagementCard canViewPayroll />}

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
            activitiesCount={activityCountVal}
            jobPools={isSuperAdminLikeDashboard ? jobPoolsVal : undefined}
            costPools={isSuperAdminLikeDashboard ? costPoolsVal : undefined}
            isLoading={staffLeave.isLoading || overview.isLoading}
          />
        )}
      </div>
    </div>
  )
}

