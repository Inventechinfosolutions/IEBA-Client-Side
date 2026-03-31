import type { Department } from "../types"

function isAddressEmpty(addr: Department["address"]): boolean {
  return (
    !addr.street?.trim() &&
    !addr.city?.trim() &&
    !addr.state?.trim() &&
    !addr.zip?.trim()
  )
}

function isContactEmpty(contact: Department["primaryContact"]): boolean {
  const n = contact.name?.trim() ?? ""
  if (n.length === 0 || n === "Not Assigned") {
    return (
      !contact.phone?.trim() &&
      !contact.email?.trim() &&
      !contact.location?.trim()
    )
  }
  return false
}

/**
 * Backend GET-by-id often omits address / contacts. React Hook Form `values` would then
 * wipe user-entered data. Keep previous (e.g. optimistic) rich fields when server payload is empty.
 */
export function mergeDepartmentDetail(prev: Department | undefined, fresh: Department): Department {
  if (!prev) return fresh

  return {
    ...fresh,
    address:
      isAddressEmpty(fresh.address) && !isAddressEmpty(prev.address)
        ? prev.address
        : fresh.address,
    primaryContact:
      isContactEmpty(fresh.primaryContact) && !isContactEmpty(prev.primaryContact)
        ? prev.primaryContact
        : fresh.primaryContact,
    secondaryContact:
      isContactEmpty(fresh.secondaryContact) && !isContactEmpty(prev.secondaryContact)
        ? prev.secondaryContact
        : fresh.secondaryContact,
    billingContact:
      isContactEmpty(fresh.billingContact) && !isContactEmpty(prev.billingContact)
        ? prev.billingContact
        : fresh.billingContact,
    settings: {
      ...fresh.settings,
      multiCodes: fresh.settings.multiCodes?.trim()
        ? fresh.settings.multiCodes
        : (prev.settings.multiCodes ?? fresh.settings.multiCodes),
    },
  }
}
