import type { LoginResult } from "@/features/auth/types"

export type User = {
  id: string
  name: string
  email: string
 
  namespace?: string

  countyName?: string
  avatar?: string

  roles?: string[]

  permissions?: string[]

  departmentRoles?: Array<{
    departmentId: number
    roleId: number
    departmentName: string
    roleName: string
  }>
}

export type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<LoginResult | void>
  
  establishDashboardSession: (user: User) => void
  signOut: () => void
  error: string | null
  clearError: () => void
}
