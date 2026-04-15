export const profileKeys = {
  all: ["profile"] as const,
  detail: (userId: string) => [...profileKeys.all, "detail", userId] as const,
  profileImage: (userId: string) => [...profileKeys.all, "profile-image", userId] as const,
}

