export type WorkerType = "1099" | "w2";

export type FormId = "w9" | "w4" | "i9" | "direct_deposit" | "drivers_license";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

export type EmployerEntity = {
  value: string;
  label: string;
  forWorkerTypes: WorkerType[];
};

export type WorkLocation = {
  value: string;
  label: string;
};

export type RequiredFormDefinition = {
  id: FormId;
  title: string;
  previewUrl?: string;
  downloadUrl?: string;
  uploadHint?: string;
  requiredFor: WorkerType[];
};

export type UploadedFormFile = {
  formId: FormId;
  fileName: string;
  blobUrl: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
};

export type ProfileFormData = {
  fullLegalName: string;
  preferredName: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  startDate: string;
  shirtSize: string;
  managerName: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  workerType: WorkerType | "";
  employerEntity: string;
  workLocationState: string;
};

export type FinalSubmissionPayload = {
  profile: ProfileFormData;
  uploads: Partial<Record<FormId, UploadedFormFile>>;
  confirmation: boolean;
};
