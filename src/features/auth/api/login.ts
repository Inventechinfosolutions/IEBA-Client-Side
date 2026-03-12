import { api, setToken } from "@/lib/api"

export type LoginCredentials = {
  email: string
  password: string
}

type LoginApiData = {
  userId: string
  loginId: string
  accessToken?: string
  access_token?: string
  token?: string
  otp?: number
  nextPage?: string
}

type LoginApiResponse = {
  data?: LoginApiData
  token?: string
  access_token?: string
  accessToken?: string
  user?: { id: string; name?: string; email: string; avatar?: string }
}

export type LoginResult = {
  id: string
  name: string
  email: string
  avatar?: string
}

function extractToken(response: LoginApiResponse): string {
  const data = response.data
  if (data) {
    return data.accessToken ?? data.access_token ?? data.token ?? ""
  }
  return (
    response.token ?? response.access_token ?? response.accessToken ?? ""
  )
}

function mapUser(response: LoginApiResponse): LoginResult {
  const data = response.data
  if (data) {
    return {
      id: data.userId,
      name: data.loginId.split("@")[0] ?? "User",
      email: data.loginId,
    }
  }
  const user = response.user
  if (!user) {
    throw new Error("Invalid login response: missing user")
  }
  return {
    id: String(user.id),
    name: user.name ?? user.email.split("@")[0] ?? "User",
    email: user.email,
    avatar: user.avatar,
  }
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const response = await api.post<LoginApiResponse>(
    "/user/login",
    {
      loginId: credentials.email,
      password: credentials.password,
    },
    { skipAuth: true }
  )

  const token = extractToken(response)
  if (!token) {
    throw new Error("Invalid login response: missing token")
  }

  setToken(token)
  return mapUser(response)
}
