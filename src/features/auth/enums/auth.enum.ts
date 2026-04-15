export const AuthJourney = {
  Dashboard: "dashboard",
  ResetPassword: "resetpassword",
  Login: "login",
} as const

export type AuthJourney = (typeof AuthJourney)[keyof typeof AuthJourney]

export const AuthNextPage = {
  Otp: "otp",
  Dashboard: "dashboard",
} as const

export type AuthNextPage = (typeof AuthNextPage)[keyof typeof AuthNextPage]
