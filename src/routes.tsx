import type { QueryClient } from "@tanstack/react-query"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { GuestOnlyRoute } from "@/components/GuestOnlyRoute"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { PermissionRoute } from "@/components/PermissionRoute"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { LoginPage, ForgotPassword, OtpAuthentication, ResetPassword } from "@/features/auth"
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
import { PersonalTimeStudyPage } from "@/features/PersonalTimeStudy/pages/PersonalTimeStudyPage"
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
import { payrollKeys } from "@/features/payroll/key"
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
      path: "/reset-password",
      element: (
        <GuestOnlyRoute>
          <ResetPassword />
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
          element: <PermissionRoute permission={["activity", "user", "payroll"]}><MasterCodePage /></PermissionRoute>,
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
          element: <PermissionRoute permission={["budgetprogram", "timestudyprogram", "timestudyactivity"]}><ProgramPage /></PermissionRoute>,
          loader: async () => {
            await queryClient.invalidateQueries({ queryKey: programKeys.lists() })
            await queryClient.invalidateQueries({ queryKey: programKeys.details() })
            await queryClient.invalidateQueries({ queryKey: programActivityRelationKeys.root })
            return null
          },
        },
        {
          path: "to-do",
          element: <PermissionRoute permission="todo"><TodoPage /></PermissionRoute>,
          loader: async () => {
            await queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
            await queryClient.invalidateQueries({ queryKey: todoKeys.details() })
            return null
          },
        },
        {
          path: "user",
          element: <PermissionRoute permission="user"><UserModulePage /></PermissionRoute>,
          loader: async () => {
            await queryClient.invalidateQueries({ queryKey: userModuleKeys.lists() })
            await queryClient.invalidateQueries({ queryKey: userModuleKeys.details() })
            return null
          },
        },
        {
          path: "leave-approval",
          element: <PermissionRoute permission="userleave"><LeaveApprovalPage /></PermissionRoute>,
          loader: async () => {
            await queryClient.invalidateQueries({ queryKey: leaveApprovalKeys.lists() })
            return null
          },
        },
        {
          path: "users",
          element: <PermissionRoute permission="superadmin"><UsersPage /></PermissionRoute>,
        },
        {
          path: "users/:id",
          element: <PermissionRoute permission="superadmin"><UserPage /></PermissionRoute>,
        },
        {
          path: "department-role",
          element: <PermissionRoute permission="superadmin"><DepartmentRolePage /></PermissionRoute>,
        },
        {
          path: "county-activity-code",
          element: <PermissionRoute permission="countyactivity"><CountyActivityCodePage /></PermissionRoute>,
        },
        { path: "settings", element: <SettingsPage /> },
        {
          path: "schedule-time-study",
          element: <PermissionRoute permission="scheduletimestudy"><ScheduleTimeStudyPage /></PermissionRoute>,
        },
        {
          path: "personal-time-study",
          element: <PermissionRoute permission="timestudypersonal"><PersonalTimeStudyPage /></PermissionRoute>,
        },
        {
          path: "costpool",
          element: <PermissionRoute permission="costpool"><CostPoolPage /></PermissionRoute>,
        },
        {
          path: "fte-allocation",
          element: <PermissionRoute permission="superadmin"><FteAllocationPage /></PermissionRoute>,
        },
        {
          path: "department",
          element: <PermissionRoute permission="department"><DepartmentPage /></PermissionRoute>,
        },
        {
          path: "profile",
          element: <ProfilePage />,
          loader: async () => {
            await queryClient.invalidateQueries({ queryKey: profileKeys.all })
            return null
          },
        },
        {
          path: "job-classification",
          element: <PermissionRoute permission="jobclassification"><JobClassificationPage /></PermissionRoute>,
        },
        {
          path: "job-pool",
          element: <PermissionRoute permission="jobpool"><JobPoolPage /></PermissionRoute>,
        },
        { path: "reports", element: <PermissionRoute permission="report"><ReportsPage /></PermissionRoute> },
        {
          path: "payroll",
          element: <PermissionRoute permission="payroll"><PayrollPage /></PermissionRoute>,
          loader: async () => {
            await queryClient.invalidateQueries({ queryKey: payrollKeys.all })
            return null
          },
        },
        { path: "reports", element: <ReportsPage /> },
      ],
    },
    { path: "*", element: <Navigate to="/" replace /> },
  ])
}
