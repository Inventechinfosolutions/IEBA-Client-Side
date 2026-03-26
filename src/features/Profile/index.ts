export { ProfilePage } from "./pages/ProfilePage"
export { ProfileDetail } from "./components/ProfileDetail"

export { profileKeys } from "./keys"
export { profileDetailDefaultValues, profileDetailFormSchema } from "./schemas"

export type {
  Relationship,
  EmergencyContactValues,
  OnRecordsValues,
  ProfileDetailFormValues,
  ProfileDetailData,
  UpdateProfileDetailInput,
} from "./types"

export { useGetProfileDetail } from "./queries/getProfileDetail"
export { useUpdateProfileDetail } from "./mutations/updateProfileDetail"

