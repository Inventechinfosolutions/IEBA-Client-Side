export { ProfilePage } from "./pages/ProfilePage"
export { ProfileDetail } from "./components/ProfileDetail"

export { getProfileDetail, saveProfileDetail } from "./api"

export { RELATIONSHIP_OPTIONS, UserRelationship } from "./enums/userrelationship.enum"

export { profileKeys } from "./keys"
export { profileDetailDefaultValues, profileDetailFormSchema } from "./schemas"

export type {
  EmergencyContactValues,
  OnRecordsValues,
  ProfileDetailFormValues,
  ProfileDetailData,
  ProfilePersistFields,
  UpdateProfileDetailInput,
} from "./types"

export { useGetProfileDetail } from "./queries/getProfileDetail"
export { useUpdateProfileDetail } from "./mutations/updateProfileDetail"

