import { z } from "zod";
import { EMPLOYER_ENTITY_OPTIONS, REQUIRED_FORMS, WORK_LOCATION_OPTIONS } from "./config";

const workerTypeSchema = z.enum(["1099", "w2"]);
type AllFormId = "w9" | "w4" | "i9" | "direct_deposit" | "drivers_license";
const formIdSchema = z.enum(
  REQUIRED_FORMS.map((form) => form.id) as [AllFormId, ...AllFormId[]],
);

const entityValues = EMPLOYER_ENTITY_OPTIONS.map((option) => option.value);
const workLocationValues = WORK_LOCATION_OPTIONS.map((option) => option.value);

export const profileFormSchema = z.object({
  fullLegalName: z.string().trim().min(1, "Full legal name is required."),
  preferredName: z.string().trim().min(1, "Preferred name is required."),
  email: z.email("Valid email is required."),
  phone: z.string().trim().min(7, "Phone is required."),
  streetAddress: z.string().trim().min(1, "Street address is required."),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().min(2, "State is required."),
  zip: z.string().trim().min(5, "Zip is required."),
  startDate: z.iso.date("Start date is required."),
  shirtSize: z.string().trim().min(1, "Shirt size is required."),
  managerName: z.string().trim().min(1, "Manager name is required."),
  emergencyContactName: z
    .string()
    .trim()
    .min(1, "Emergency contact name is required."),
  emergencyContactPhone: z
    .string()
    .trim()
    .min(7, "Emergency contact phone is required."),
  workerType: workerTypeSchema,
  employerEntity: z
    .string()
    .refine((value) => entityValues.includes(value), "Employer entity is required."),
  workLocationState: z
    .string()
    .refine((value) => workLocationValues.includes(value), "Work location is required."),
});

export const uploadedFormFileSchema = z.object({
  formId: formIdSchema,
  fileName: z.string().min(1),
  blobUrl: z.url(),
  size: z.number().int().positive(),
  mimeType: z.string().min(1),
  uploadedAt: z.iso.datetime(),
});

export const finalSubmissionSchema = z.object({
  profile: profileFormSchema,
  uploads: z.partialRecord(formIdSchema, uploadedFormFileSchema),
  confirmation: z.literal(true),
});

export const uploadClientPayloadSchema = z.object({
  submissionId: z.string().min(10),
  formId: formIdSchema,
  originalFileName: z.string().min(1),
  size: z.number().int().positive(),
  mimeType: z.string().min(1),
});

export type ProfileFormInput = z.infer<typeof profileFormSchema>;
export type UploadedFormFileInput = z.infer<typeof uploadedFormFileSchema>;
export type FinalSubmissionInput = z.infer<typeof finalSubmissionSchema>;
export type UploadClientPayloadInput = z.infer<typeof uploadClientPayloadSchema>;
