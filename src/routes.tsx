import type { QueryClient } from "@tanstack/react-query"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { GuestOnlyRoute } from "@/components/GuestOnlyRoute"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { PermissionRoute } from "@/components/PermissionRoute"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { LoginPage, ForgotPassword, OtpAuthentication, ResetPassword } from "@/features/auth"
import { lazyWithRetry } from "@/lib/lazyWithRetry"
const DashboardPage = lazyWithRetry(() => import("@/features/dashboard/pages/DashboardPage"))
const MasterCodePage = lazyWithRetry(() => import("@/features/master-code/pages/MasterCodePage"))
const ProgramPage = lazyWithRetry(() => import("@/features/program/pages/ProgramPage"))
const ReportsPage = lazyWithRetry(() => import("@/features/reports/pages/ReportsPage"))
const TodoPage = lazyWithRetry(() => import("@/features/todo/pages/TodoPage"))
const UserModulePage = lazyWithRetry(() => import("@/features/user/pages/UserModulePage"))
const LeaveApprovalPage = lazyWithRetry(() => import("@/features/leave-approval/pages/LeaveApprovalPage"))
const UsersPage = lazyWithRetry(() => import("@/features/users/pages/UsersPage"))
const UserPage = lazyWithRetry(() => import("@/features/users/pages/UserPage"))
const DepartmentRolePage = lazyWithRetry(() => import("@/features/DepartmentRole/pages/DepartmentRolePage"))
const CountyActivityCodePage = lazyWithRetry(() => import("@/features/CountyActivityCode/pages/CountyActivityCodePage"))
const SettingsPage = lazyWithRetry(() => import("@/features/settings/pages/SettingsPage"))
const ScheduleTimeStudyPage = lazyWithRetry(() => import("@/features/schedule-time-study/pages/ScheduleTimeStudyPage"))
const PersonalTimeStudyPage = lazyWithRetry(() => import("@/features/PersonalTimeStudy/pages/PersonalTimeStudyPage"))
const ProfilePage = lazyWithRetry(() => import("@/features/Profile/pages/ProfilePage"))
const CostPoolPage = lazyWithRetry(() => import("@/features/cost-pool/pages/CostPoolPage"))
const JobClassificationPage = lazyWithRetry(() => import("@/features/job-classification/pages/JobClassificationPage"))
const JobPoolPage = lazyWithRetry(() => import("@/features/job-pool/pages/JobPoolPage"))
// const FteAllocationPage = lazyWithRetry(() => import("@/features/fte-allocation/pages/FteAllocationPage"))
const DepartmentPage = lazyWithRetry(() => import("@/features/department/pages/DepartmentPage"))
const PayrollPage = lazyWithRetry(() => import("@/features/payroll/pages/PayrollPage"))
import { userModuleKeys } from "@/features/user/keys"
import { profileKeys } from "@/features/Profile/keys"
import { masterCodeKeys } from "@/features/master-code/keys"
import { programKeys, programActivityRelationKeys } from "@/features/program/keys"
import { todoKeys } from "@/features/todo/keys"
import { leaveApprovalKeys } from "@/features/leave-approval/keys"
import { payrollKeys } from "@/features/payroll/key"

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
        // {
        //   path: "fte-allocation",
        //   element: <PermissionRoute permission="superadmin"><FteAllocationPage /></PermissionRoute>,
        // },
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
        {
          path: "reports",
          element: (
            <PermissionRoute permission="report">
              <ReportsPage />
            </PermissionRoute>
          ),
        },
        {
          path: "payroll",
          element: <PermissionRoute permission="payroll"><PayrollPage /></PermissionRoute>,
          loader: async () => {
            await queryClient.invalidateQueries({ queryKey: payrollKeys.all })
            return null
          },
        },
      ],
    },
    { path: "*", element: <Navigate to="/" replace /> },
  ])
}
