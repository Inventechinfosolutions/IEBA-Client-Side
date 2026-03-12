import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

export type User = {
  id: string
  name: string
  email: string
  avatar?: string
}

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const signIn = useCallback(async (email: string, _password: string) => {
    setIsLoading(true)
    try {
      // Demo: accept any email/password and create a fake user
      const demoUser: User = {
        id: "1",
        name: email.split("@")[0] || "User",
        email,
        avatar: undefined,
      }
      setUser(demoUser)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signOut,
    }),
    [user, isLoading, signIn, signOut]
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
