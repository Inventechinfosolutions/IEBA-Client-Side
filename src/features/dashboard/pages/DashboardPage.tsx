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

import {
  usePersonalTimeStudy,
  useTimeRecordRequests,
  useSelfLeave,
  useStaffLeave,
  useTodos,
  useHolidays,
  useUserCount,
  useActiveUsers,
  useDepartmentCount,
  useProgramCount,
  useJpCpTotals,
  useReportsByRole,
} from "../queries/dashboardQueries"
import { getPayrollDateRange } from "../api/dashboard"


function hasPermission(permissions: string[] | undefined, key: string): boolean {
  if (!permissions) return false
  return permissions.includes(key) || permissions.includes("superadmin:all")
}

export function DashboardPage() {
  const { user } = useAuth()
  const userId = user?.id ?? ""
  const permissions = user?.permissions


  const isAdmin = hasPermission(permissions, "superadmin:all")
  const canAddPayroll = hasPermission(permissions, "payroll:add") || isAdmin


  const payrollType = "monthly"
  const { label: periodLabel } = getPayrollDateRange(payrollType)



  const personalTS = usePersonalTimeStudy({
    userId,
    payrollType,
    reqMins: 480, // default 8hrs, can be driven by settings later
  })

  const timeRecordRequests = useTimeRecordRequests({ userId, payrollType })

  const selfLeave = useSelfLeave(userId)
  const staffLeave = useStaffLeave()
  const todos = useTodos()
  const holidays = useHolidays()
  const userCount = useUserCount()
  const activeUsers = useActiveUsers()
  const deptCount = useDepartmentCount()
  const programCount = useProgramCount()
  const jpCp = useJpCpTotals()
  const reports = useReportsByRole()

  // ── Derived values ────────────────────────────────────────────────────────

  const tsApproved = personalTS.data?.approved ?? 0
  const tsSubmitted = personalTS.data?.submitted ?? 0
  const tsReqMins = 480 * 22 // approx month
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

  const holidayList =
    holidays.data?.list && holidays.data.list.length > 0
      ? holidays.data.list
      : [
        { date: "2026-02-16T00:00:00Z", description: "Presidents' Day" },
        { date: "2026-03-31T00:00:00Z", description: "Cesar Chavez Day" },
        { date: "2026-05-25T00:00:00Z", description: "Memorial Day" },
        { date: "2026-06-19T00:00:00Z", description: "Juneteenth" },
      ]

  const nextHolidayMonth = holidays.data?.nextMonth ?? ""
  const nextHolidayDay = holidays.data?.nextDay ?? "0"

  const todoItems = todos.data ?? []
  const userCountVal = userCount.data ?? 0
  const activeUsersVal = activeUsers.data ?? 0
  const deptCountVal = deptCount.data ?? 0
  const programCountVal = programCount.data ?? 0
  const jobPoolsVal = jpCp.data?.jobPools
  const costPoolsVal = jpCp.data?.costPools
  const reportsData = reports.data ?? []



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

      {/* ── Row 2: h-[380px] ── */}
      <div className="grid gap-4 h-[320px]" style={{ gridTemplateColumns: "0.90fr 1.10fr 1.23fr 0.81fr" }}>


        <div className="flex flex-col gap-3">
          <UsersCard
            userCount={userCountVal}
            activeUsers={activeUsersVal}
            isLoading={userCount.isLoading || activeUsers.isLoading}
          />
          <div className="flex-1 min-h-0">
            <HolidayListCard list={holidayList} isLoading={holidays.isLoading} />
          </div>
        </div>

        {/* Payroll Management */}
        {canAddPayroll ? (
          <PayrollManagementCard canViewPayroll />
        ) : (
          <div className="flex items-center justify-center rounded-[10px] border border-dashed border-[#E8EAF6] bg-white text-sm text-[#9CA3AF] shadow-[0_0_20px_0_#0000001a]">
            No payroll access
          </div>
        )}

        {/* Reports */}
        <div className="h-full overflow-hidden min-h-0">
          <ReportsCard reports={reportsData} isLoading={reports.isLoading} />
        </div>

        {/* Staff Leave + Stats */}
        <StaffStatsCard
          open={staffLeaveOpen}
          approved={staffLeaveApproved}
          rejected={staffLeaveRejected}
          deptCount={deptCountVal}
          programCount={programCountVal}
          jobPools={jobPoolsVal}
          costPools={costPoolsVal}
          isLoading={staffLeave.isLoading || deptCount.isLoading || programCount.isLoading || jpCp.isLoading}
        />
      </div>
    </div>
  )
}
