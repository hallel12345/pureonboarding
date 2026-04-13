import { REQUIRED_FORMS } from "./config";
import { FormId, RequiredFormDefinition, WorkerType } from "./types";

export function getRequiredFormsByWorkerType(workerType: WorkerType): RequiredFormDefinition[] {
  return REQUIRED_FORMS.filter((form) => form.requiredFor.includes(workerType));
}

export function getFormById(formId: FormId): RequiredFormDefinition | undefined {
  return REQUIRED_FORMS.find((form) => form.id === formId);
}

export function allRequiredFormsUploaded(
  workerType: WorkerType,
  uploadedFormIds: FormId[],
): boolean {
  const requiredIds = getRequiredFormsByWorkerType(workerType).map((form) => form.id);
  return requiredIds.every((requiredId) => uploadedFormIds.includes(requiredId));
}
