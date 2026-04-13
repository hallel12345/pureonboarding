import { getRequiredFormsByWorkerType } from "./forms";
import { finalSubmissionSchema, type FinalSubmissionInput } from "./schema";

export function validateSubmissionPayload(payload: unknown): FinalSubmissionInput {
  return finalSubmissionSchema.parse(payload);
}

export function ensureRequiredUploadsPresent(payload: FinalSubmissionInput) {
  const requiredForms = getRequiredFormsByWorkerType(payload.profile.workerType);
  const missingForms = requiredForms.filter((form) => !payload.uploads[form.id]);

  if (missingForms.length > 0) {
    throw new Error(
      `Missing required uploads: ${missingForms.map((form) => form.title).join(", ")}`,
    );
  }
}

export function buildSubmissionEmailText(payload: FinalSubmissionInput): string {
  const profile = payload.profile;

  const uploadLines = Object.values(payload.uploads)
    .filter((upload) => Boolean(upload))
    .map((upload) => `- ${upload.fileName}: ${upload.blobUrl}`)
    .join("\n");

  return [
    "Pure Pest Onboarding Submission",
    "",
    "Employee Details",
    `Full legal name: ${profile.fullLegalName}`,
    `Preferred name: ${profile.preferredName}`,
    `Email: ${profile.email}`,
    `Phone: ${profile.phone}`,
    `Street address: ${profile.streetAddress}`,
    `City: ${profile.city}`,
    `State: ${profile.state}`,
    `Zip: ${profile.zip}`,
    `Start date: ${profile.startDate}`,
    `Shirt size: ${profile.shirtSize}`,
    `Manager name: ${profile.managerName}`,
    `Emergency contact name: ${profile.emergencyContactName}`,
    `Emergency contact phone: ${profile.emergencyContactPhone}`,
    "",
    "Employment",
    `Worker type: ${profile.workerType}`,
    `Employer entity: ${profile.employerEntity}`,
    `Work location/state: ${profile.workLocationState}`,
    "",
    "Uploaded Forms",
    uploadLines || "- No uploads found",
  ].join("\n");
}
