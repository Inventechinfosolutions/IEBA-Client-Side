import type { CountyClientDetailModel } from "@/features/settings/queries/getCountyClient"
import type { CountySettingsModel } from "@/features/settings/components/Country/types"

/** Maps tenant client API payload to the county slice of `SettingsFormValues`. */
export function mapCountyClientDetailToCountySettings(
  client: CountyClientDetailModel,
): CountySettingsModel {
  const activeLocations = (client.locations ?? []).slice(0, 4)
  const addresses: CountySettingsModel["addresses"] =
    activeLocations.length > 0
      ? activeLocations.map((loc) => ({
          locationId: loc.id,
          location: loc.name ?? "",
          street: loc.street ?? "",
          city: loc.city ?? "",
          state: loc.state ?? "",
          zip: loc.zip ?? "",
        }))
      : [{ locationId: undefined, location: "", street: "", city: "", state: "", zip: "" }]

  const start = client.startTime ?? "00:00"

  return {
    // Prefer document content (base64/data URL), then document URL, then legacy `logo`.
    logoDataUrl: client.document?.content ?? client.document?.url ?? client.logo ?? null,
    countyName: client.name ?? "",
    welcomeMessage: client.message ?? "",
    isTimeRangeEnabled: Boolean(client.timeRule),
    startTime1: start,
    startTime2: start,
    endTime: client.endTime ?? "00:00",
    includedWeekends: Boolean(client.include_weekend),
    autoApproval: Boolean(client.autoApproval),
    supervisorApportioning: Boolean(client.apportioning),
    addresses,
  }
}
