export type User = {
  id: string
  name: string
  email: string
  /** Selected tenant/namespace key from OTP step. */
  namespace?: string
  /** Human-friendly county name for header display, e.g. 'Lassen County'. */
  countyName?: string
  avatar?: string
}

export type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  /** After login when `nextPage` is `dashboard`; token is already in storage from `loginRequest`. */
  establishDashboardSession: (user: User) => void
  signOut: () => void
  error: string | null
  clearError: () => void
}
