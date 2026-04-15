export const authKeys = {
  all: ["auth"] as const,
  login: () => [...authKeys.all, "login"] as const,
  sendResetOtp: () => [...authKeys.all, "sendResetOtp"] as const,
  forgotPassword: () => [...authKeys.all, "forgotPassword"] as const,
  validateOtp: () => [...authKeys.all, "validateOtp"] as const,
  globalNamespaces: () => [...authKeys.all, "globalNamespaces"] as const,
  changeCounty: () => [...authKeys.all, "changeCounty"] as const,
  resetPassword: () => [...authKeys.all, "resetPassword"] as const,
}
