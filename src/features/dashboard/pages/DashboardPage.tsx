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

import {
  usePersonalTimeStudy,
  useTimeRecordRequests,
  useSelfLeave,
  useStaffLeave,
  useTodos,
  useHolidays,
  useDashboardOverview,
  useReportsByRole,
} from "../queries/dashboardQueries"
import { getPayrollDateRange } from "../api/dashboard"
import { Building2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import React from "react"


import { PayrollPeriod } from "../enums/dashboard.enum"

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


  const payrollType = PayrollPeriod.Monthly
  const { label: periodLabel } = getPayrollDateRange(payrollType)

  const deptRoles = user?.departmentRoles ?? []
  const [selectedDeptRoleIdx, setSelectedDeptRoleIdx] = React.useState<string>(
    deptRoles.length > 0 ? "0" : ""
  )

  const currentDeptRole = deptRoles[Number(selectedDeptRoleIdx)]
  const departmentId = currentDeptRole?.departmentId
  const roleId = currentDeptRole?.roleId

  const personalTS = usePersonalTimeStudy({
    userId,
    payrollType,
    reqMins: 480,
    departmentId,
    roleId,
    enabled: isAdmin,
  })

  const timeRecordRequests = useTimeRecordRequests({ 
    userId, 
    payrollType, 
    departmentId, 
    roleId,
    enabled: isAdmin,
  })

  const selfLeave = useSelfLeave(userId)
  const staffLeave = useStaffLeave({ enabled: isAdmin })
  const todos = useTodos()
  const holidays = useHolidays()
  const overview = useDashboardOverview({ enabled: isAdmin })
  const reports = useReportsByRole({ 
    departmentId, 
    roleId,
    enabled: isAdmin,
  })

  
  const {
    totalUserCount: userCountVal = 0,
    totalDepartmentCount: deptCountVal = 0,
    totalTimeStudyProgramCount: programCountVal = 0,
    totalJobPoolCount: jobPoolsVal = 0,
    totalCostPoolCount: costPoolsVal = 0,
    totalActivityCount: activityCountVal = 0,
  } = overview.data ?? {}

  const activeUsersVal = 0

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


  if (!isAdmin) {
    return <UserDashboard />
  }

  return (
    <div className="flex flex-col gap-4 w-full min-h-0">
      {/* Header with Selector */}
      {deptRoles.length > 0 && (
        <div className="flex items-center justify-between bg-white p-3 rounded-[15px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#E8EAF6] transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#6C5DD3]" />
            <span className="text-sm font-semibold text-[#111827]">Department Scope</span>
          </div>
          <Select
            value={selectedDeptRoleIdx}
            onValueChange={setSelectedDeptRoleIdx}
          >
            <SelectTrigger className="w-[300px] h-10 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] text-sm focus:ring-[#6C5DD3]/20 focus:border-[#6C5DD3]/40">
              <SelectValue placeholder="Select Department/Role" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8EAF6] shadow-xl">
              {deptRoles.map((dr, idx) => (
                <SelectItem key={idx} value={String(idx)} className="cursor-pointer hover:bg-[#6C5DD3]/5 rounded-lg my-1 mx-1">
                  <div className="flex items-center gap-2 py-1">
                    <span className="font-semibold text-[#111827]">{dr.departmentName}</span>
                    <span className="text-[#9CA3AF]">—</span>
                    <span className="text-[#6B7280]">{dr.roleName}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}


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
      <div className="grid gap-4 h-[285px]" style={{ gridTemplateColumns: "0.90fr 1.10fr 1.23fr 0.81fr" }}>


        <div className="flex flex-col gap-3">
          <UsersCard
            userCount={userCountVal}
            activeUsers={activeUsersVal}
            isLoading={overview.isLoading}
          />
          <div className="flex-1 min-h-0">
            <HolidayListCard />
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
          activitiesCount={activityCountVal}
          jobPools={jobPoolsVal}
          costPools={costPoolsVal}
          isLoading={staffLeave.isLoading || overview.isLoading}
        />
      </div>
    </div>
  )
}

