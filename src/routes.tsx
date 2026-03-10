import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppLayout } from "@/layouts/AppLayout"
import { Dashboard } from "@/pages/Dashboard"
import { UsersPage } from "@/pages/UsersPage"
import { PlaceholderPage } from "@/pages/PlaceholderPage"

const placeholderRoutes = [
  { path: "personal-time-study", title: "Personal Time Study" },
  { path: "to-do", title: "To Do" },
  { path: "reports", title: "Reports" },
  { path: "payroll", title: "Payroll" },
  { path: "department", title: "Department" },
  { path: "program", title: "Program" },
  { path: "county-activity-code", title: "County Activity Code" },
  { path: "master-code", title: "Master Code" },
  { path: "department-role", title: "Department Role" },
  { path: "job-classification", title: "Job Classification" },
  { path: "job-pool", title: "Job Pool" },
  { path: "leave-approval", title: "Leave Approval" },
  { path: "fte-allocation", title: "FTE Allocation" },
  { path: "cost-pool", title: "Cost Pool" },
  { path: "schedule-time-study", title: "Schedule Time Study" },
]

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "users", element: <UsersPage /> },
      ...placeholderRoutes.map(({ path, title }) => ({
        path,
        element: <PlaceholderPage title={title} />,
      })),
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
])
