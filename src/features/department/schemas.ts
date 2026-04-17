import { z } from "zod"

export const departmentContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
})

export const departmentAddressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(3, "Zip min 3 digits"),
})

export const departmentSettingsSchema = z.object({
  apportioning: z.boolean(),
  costAllocation: z.boolean(),
  autoApportioning: z.boolean(),
  allowUserCostpoolDirect: z.boolean(),
  allowMultiCodes: z.boolean(),
  multiCodes: z.string().optional().or(z.literal("")),
  removeStartEndTime: z.boolean(),
  removeSupportingDocument: z.boolean(),
  removeAutoFillEndTime: z.boolean(),
  removeDescriptionActivityNote: z.boolean(),
})

export const departmentUpsertSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Department name is required"),
  active: z.boolean(),
  address: departmentAddressSchema,
  primaryContactId: z.string().optional().nullable(),
  secondaryContactId: z.string().optional().nullable(),
  billingContactId: z.string().optional().nullable(),
  primaryContact: departmentContactSchema,
  secondaryContact: departmentContactSchema,
  billingContact: departmentContactSchema,
  settings: departmentSettingsSchema,
})

export const DEPARTMENT_FORM_DEFAULT_VALUES: z.infer<typeof departmentUpsertSchema> = {
  code: "",
  name: "",
  active: true,
  address: {
    street: "",
    city: "",
    state: "",
    zip: "",
  },
  primaryContactId: null,
  secondaryContactId: null,
  billingContactId: null,
  primaryContact: {
    name: "",
    phone: "",
    email: "",
    location: "",
  },
  secondaryContact: {
    name: "",
    phone: "",
    email: "",
    location: "",
  },
  billingContact: {
    name: "",
    phone: "",
    email: "",
    location: "",
  },
  settings: {
    apportioning: false,
    costAllocation: false,
    autoApportioning: false,
    allowUserCostpoolDirect: false,
    allowMultiCodes: false,
    multiCodes: "",
    removeStartEndTime: false,
    removeSupportingDocument: false,
    removeAutoFillEndTime: false,
    removeDescriptionActivityNote: false,
  },
}

export const departmentSchema = departmentUpsertSchema.extend({
  id: z.string(),
  canEdit: z.boolean().optional(),
})

export const departmentFilterSchema = z.object({
  search: z.string().trim().optional(),
  inactive: z.boolean().default(false),
})
