import type { LoginResult } from "@/features/auth/types"

export type User = {
  id: string
  name: string
  email: string
 
  namespace?: string

  countyName?: string
  avatar?: string

  /**
   * When true, user must change password before continuing into the app.
   * Populated from user-details API.
   */
  isPasswordChangeRequired?: boolean

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
  isInitialLoading: boolean
  signIn: (email: string, password: string) => Promise<LoginResult | void>
  
  establishDashboardSession: (user: User) => void
  signOut: () => void
  error: string | null
  clearError: () => void
}
