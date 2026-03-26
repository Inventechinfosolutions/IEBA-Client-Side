export type CountyAddressRow = {
  location: string
  street: string
  city: string
  state: string
  zip: string
}

export type CountySettingsModel = {
  logoDataUrl: string | null
  countyName: string
  welcomeMessage: string
  isTimeRangeEnabled: boolean
  startTime1: string
  startTime2: string
  endTime: string
  includedWeekends: boolean
  autoApproval: boolean
  supervisorApportioning: boolean
  addresses: CountyAddressRow[]
}

export type CountyAddressRowProps = {
  index: number
  onRemove: () => void
  canRemove: boolean
}

export type CountyFormProps = {
  isSaving: boolean
}

export type RequiredLabelProps = {
  children: string
}

