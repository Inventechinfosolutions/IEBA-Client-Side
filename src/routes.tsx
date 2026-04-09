import type { QueryClient } from "@tanstack/react-query"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { GuestOnlyRoute } from "@/components/GuestOnlyRoute"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { LoginPage, ForgotPassword, OtpAuthentication } from "@/features/auth"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { MasterCodePage } from "@/features/master-code"
import { ProgramPage } from "@/features/program"
import { ReportsPage } from "@/features/reports"
import { TodoPage } from "@/features/todo"
import { UserModulePage } from "@/features/user"
import { LeaveApprovalPage } from "@/features/leave-approval"
import { UsersPage, UserPage } from "@/features/users"
import { DepartmentRolePage } from "@/features/DepartmentRole/pages/DepartmentRolePage"
import { CountyActivityCodePage } from "@/features/CountyActivityCode/pages/CountyActivityCodePage"
import { SettingsPage } from "@/features/settings"
import { ScheduleTimeStudyPage } from "@/features/schedule-time-study"
import { ProfilePage } from "@/features/Profile"
import { CostPoolPage } from "@/features/cost-pool"
import { JobClassificationPage } from "@/features/job-classification"
import { JobPoolPage } from "@/features/job-pool"
import { FteAllocationPage } from "@/features/fte-allocation"
import { DepartmentPage } from "@/features/department"
import { masterCodeKeys } from "@/features/master-code/keys"
import { programKeys, programActivityRelationKeys } from "@/features/program/keys"
import { todoKeys } from "@/features/todo/keys"
import { leaveApprovalKeys } from "@/features/leave-approval/keys"
import { payrollKeys } from "@/features/payroll/payrollKeys"
import { PayrollPage } from "@/features/payroll/pages/PayrollPage"
import { userModuleKeys } from "@/features/user/keys"
import { profileKeys } from "@/features/Profile/keys"

/** Inject `queryClient` from `main.tsx`: importing `@/main` here would be circular, but the rest of the app still uses the same instance via `import { queryClient } from "@/main"`. */
export function createAppRouter(queryClient: QueryClient) {
  return createBrowserRouter([
    {
      path: "/login",
      element: (
        <GuestOnlyRoute>
          <LoginPage />
        </GuestOnlyRoute>
      ),
    },
    {
      path: "/forgot-password",
      element: (
        <GuestOnlyRoute>
          <ForgotPassword />
        </GuestOnlyRoute>
      ),
    },
    {
      path: "/otp",
      element: (
        <GuestOnlyRoute>
          <OtpAuthentication />
        </GuestOnlyRoute>
      ),
    },
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <DashboardPage /> },
        {
          path: "master-code",
          element: <MasterCodePage />,
          loader: async () => {
            await queryClient.invalidateQueries({ queryKey: masterCodeKeys.lists() })
            await queryClient.invalidateQueries({ queryKey: masterCodeKeys.details() })
            await queryClient.invalidateQueries({ queryKey: masterCodeKeys.activityCodesCatalogAll() })
            await queryClient.invalidateQueries({ queryKey: masterCodeKeys.activityCodesCatalogEnrichment() })
            return null
          },
        },
        {
          path: "program",
          element: <ProgramPage />,
          loader: async () => {
            await queryClient.invalidateQueries({ queryKey: programKeys.lists() })
            await queryClient.invalidateQueries({ queryKey: programKeys.details() })
            await queryClient.invalidateQueries({ queryKey: programActivityRelationKeys.root })
            return null
          },
        },
        {
          path: "to-do",
          element: <TodoPage />,
          loader: async () => {
            await queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
            await queryClient.invalidateQueries({ queryKey: todoKeys.details() })
            return null
          },
        },
        {
          path: "user",
          element: <UserModulePage />,
          loader: async () => {
            await queryClient.invalidateQueries({ queryKey: userModuleKeys.lists() })
            await queryClient.invalidateQueries({ queryKey: userModuleKeys.details() })
            return null
          },
        },
        {
          path: "leave-approval",
          element: <LeaveApprovalPage />,
          loader: async () => {
            await queryClient.invalidateQueries({ queryKey: leaveApprovalKeys.lists() })
            return null
          },
        },
        { path: "users", element: <UsersPage /> },
        { path: "users/:id", element: <UserPage /> },
        { path: "department-role", element: <DepartmentRolePage /> },
        {
          path: "county-activity-code",
          element: <CountyActivityCodePage />,
        },
        { path: "settings", element: <SettingsPage /> },
        {
          path: "schedule-time-study",
          element: <ScheduleTimeStudyPage />,
        },
        { path: "costpool", element: <CostPoolPage /> },
        { path: "fte-allocation", element: <FteAllocationPage /> },
        { path: "department", element: <DepartmentPage /> },
        {
          path: "profile",
          element: <ProfilePage />,
          loader: async () => {
            await queryClient.invalidateQueries({ queryKey: profileKeys.all })
            return null
          },
        },
        { path: "job-classification", element: <JobClassificationPage /> },
        { path: "job-pool", element: <JobPoolPage /> },
        {
          path: "payroll",
          element: <PayrollPage />,
          loader: async () => {
            await queryClient.invalidateQueries({ queryKey: payrollKeys.lists() })
            return null
          },
        },
      ],
    },
    { path: "*", element: <Navigate to="/" replace /> },
  ])
}
