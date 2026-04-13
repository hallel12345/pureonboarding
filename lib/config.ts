import { EmployerEntity, RequiredFormDefinition, WorkLocation, WorkerType } from "./types";

export const WORKER_TYPE_OPTIONS: { value: WorkerType; label: string }[] = [
  { value: "1099", label: "1099 Sales Rep" },
  { value: "w2", label: "W-2 Employee" },
];

export const EMPLOYER_ENTITY_OPTIONS: EmployerEntity[] = [
  { value: "pure-pest-ut", label: "Pure Pest Solutions (Utah)" },
  { value: "pure-pest-id", label: "Pure Pest Solutions (Idaho)" },
];

export const WORK_LOCATION_OPTIONS: WorkLocation[] = [
  { value: "UT", label: "Utah" },
  { value: "ID", label: "Idaho" },
  { value: "AZ", label: "Arizona" },
];

export const REQUIRED_FORMS: RequiredFormDefinition[] = [
  {
    id: "w9",
    title: "W-9 (2026)",
    previewUrl: "/forms/w9-2026.pdf",
    downloadUrl: "/forms/w9-2026.pdf",
    requiredFor: ["1099"],
  },
  {
    id: "w4",
    title: "W-4",
    previewUrl: "/forms/w4.pdf",
    downloadUrl: "/forms/w4.pdf",
    requiredFor: ["w2"],
  },
  {
    id: "i9",
    title: "I-9 (2026)",
    previewUrl: "/forms/i9-2026.pdf",
    downloadUrl: "/forms/i9-2026.pdf",
    requiredFor: ["w2"],
  },
  {
    id: "direct_deposit",
    title: "Direct Deposit Form",
    previewUrl: "/forms/direct-deposit.pdf",
    downloadUrl: "/forms/direct-deposit.pdf",
    requiredFor: ["1099", "w2"],
  },
  {
    id: "drivers_license",
    title: "Driver's License",
    uploadHint:
      "Upload a clear photo or scan of the front of your current driver's license (PDF, PNG, or JPG).",
    requiredFor: ["w2"],
  },
];

export const SHIRT_SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

export const MAX_UPLOAD_SIZE_BYTES = 1024 * 1024 * 256; // 256MB

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

export const ALLOWED_UPLOAD_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"];
