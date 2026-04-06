import { apiGetUserDetails } from "@/features/user/api"
/* Loads `GET /users/:id/details` using the post-OTP access token.*/
export async function getUserDetails(userId: string) {
  return apiGetUserDetails(userId)
}
