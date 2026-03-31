export const authKeys = {
  all: ["auth"] as const,
  login: () => [...authKeys.all, "login"] as const,
  validateOtp: () => [...authKeys.all, "validateOtp"] as const,
  globalNamespaces: () => [...authKeys.all, "globalNamespaces"] as const,
  changeCounty: () => [...authKeys.all, "changeCounty"] as const,
}
