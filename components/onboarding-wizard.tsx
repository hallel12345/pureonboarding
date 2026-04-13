"use client";

import { upload } from "@vercel/blob/client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EMPLOYER_ENTITY_OPTIONS,
  REQUIRED_FORMS,
  SHIRT_SIZE_OPTIONS,
  WORK_LOCATION_OPTIONS,
  WORKER_TYPE_OPTIONS,
} from "@/lib/config";
import { getRequiredFormsByWorkerType } from "@/lib/forms";
import { profileFormSchema } from "@/lib/schema";
import { buildBlobPathname } from "@/lib/upload";
import type {
  FinalSubmissionPayload,
  FormId,
  ProfileFormData,
  UploadStatus,
  UploadedFormFile,
  WorkerType,
} from "@/lib/types";

type UploadState = {
  status: UploadStatus;
  progress: number;
  error: string | null;
  pendingFile: File | null;
};

const INITIAL_PROFILE: ProfileFormData = {
  fullLegalName: "",
  preferredName: "",
  email: "",
  phone: "",
  streetAddress: "",
  city: "",
  state: "",
  zip: "",
  startDate: "",
  shirtSize: "",
  managerName: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  workerType: "",
  employerEntity: "",
  workLocationState: "",
};

function createSubmissionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function OnboardingWizard() {
  const router = useRouter();
  const [submissionId] = useState<string>(createSubmissionId);
  const [profile, setProfile] = useState<ProfileFormData>(INITIAL_PROFILE);
  const [uploadedFiles, setUploadedFiles] = useState<
    Partial<Record<FormId, UploadedFormFile>>
  >({});
  const [uploadStates, setUploadStates] = useState<Partial<Record<FormId, UploadState>>>({});
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requiredForms = useMemo(() => {
    if (!profile.workerType) {
      return [];
    }

    return getRequiredFormsByWorkerType(profile.workerType as WorkerType);
  }, [profile.workerType]);

  const profileValidation = profileFormSchema.safeParse(
    profile.workerType ? profile : { ...profile, workerType: undefined },
  );

  const isProfileValid = profileValidation.success;
  const hasAllRequiredUploads =
    profile.workerType !== "" &&
    requiredForms.every((requiredForm) => Boolean(uploadedFiles[requiredForm.id]));

  const canSubmit =
    isProfileValid && hasAllRequiredUploads && confirmationChecked && !isSubmitting;

  function setProfileValue<K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function setUploadState(formId: FormId, state: Partial<UploadState>) {
    setUploadStates((prev) => {
      const current: UploadState = prev[formId] ?? {
        status: "idle",
        progress: 0,
        error: null,
        pendingFile: null,
      };

      return {
        ...prev,
        [formId]: {
          ...current,
          ...state,
        },
      };
    });
  }

  async function uploadFile(formId: FormId, file: File) {
    setSubmitError(null);
    setUploadState(formId, {
      status: "uploading",
      progress: 0,
      error: null,
      pendingFile: file,
    });

    try {
      const blobPath = buildBlobPathname(submissionId, formId, file.name);
      const blob = await upload(blobPath, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        multipart: true,
        clientPayload: JSON.stringify({
          submissionId,
          formId,
          originalFileName: file.name,
          size: file.size,
          mimeType: file.type,
        }),
        onUploadProgress: (progressEvent) => {
          setUploadState(formId, {
            status: "uploading",
            progress: progressEvent.percentage,
            error: null,
          });
        },
      });

      const uploaded: UploadedFormFile = {
        formId,
        fileName: file.name,
        blobUrl: blob.url,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
      };

      setUploadedFiles((prev) => ({ ...prev, [formId]: uploaded }));
      setUploadState(formId, {
        status: "success",
        progress: 100,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Upload failed. Please retry this file.";

      setUploadState(formId, {
        status: "error",
        progress: 0,
        error: errorMessage,
      });
    }
  }

  function retryUpload(formId: FormId) {
    const pendingFile = uploadStates[formId]?.pendingFile;
    if (!pendingFile) {
      return;
    }

    void uploadFile(formId, pendingFile);
  }

  function clearUpload(formId: FormId) {
    setUploadedFiles((prev) => {
      const next = { ...prev };
      delete next[formId];
      return next;
    });

    setUploadState(formId, {
      status: "idle",
      progress: 0,
      error: null,
      pendingFile: null,
    });
  }

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    const payload: FinalSubmissionPayload = {
      profile,
      uploads: uploadedFiles,
      confirmation: true,
    };

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Submission failed.");
      }

      router.push("/success");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Submission failed. Please retry.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="shell">
      <section className="page-header">
        <p className="eyebrow">Pure Pest Solutions</p>
        <h1>Employee & Technician Onboarding</h1>
        <p className="subtitle">
          Complete each section in order. Final submission is locked until all required fields and
          required form uploads are complete.
        </p>
      </section>

      <section className="panel">
        <h2>1. Welcome & Instructions</h2>
        <ul className="instruction-list">
          <li>Review the required forms for your worker type.</li>
          <li>Download, complete, sign, then upload each required form.</li>
          <li>Submission is blocked until every required upload is successful.</li>
        </ul>
      </section>

      <section className="panel">
        <h2>2. Worker Type</h2>
        <div className="grid-two">
          {WORKER_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={profile.workerType === option.value ? "choice selected" : "choice"}
              onClick={() => setProfileValue("workerType", option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>3. Employer Entity & Work Location</h2>
        <div className="field-grid">
          <label>
            Employer Entity
            <select
              value={profile.employerEntity}
              onChange={(event) => setProfileValue("employerEntity", event.target.value)}
            >
              <option value="">Select an entity</option>
              {EMPLOYER_ENTITY_OPTIONS.map((entity) => (
                <option key={entity.value} value={entity.value}>
                  {entity.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Work Location / State
            <select
              value={profile.workLocationState}
              onChange={(event) => setProfileValue("workLocationState", event.target.value)}
            >
              <option value="">Select a location</option>
              {WORK_LOCATION_OPTIONS.map((location) => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>4. Supporting Information</h2>
        <div className="field-grid">
          <label>
            Full Legal Name
            <input
              value={profile.fullLegalName}
              onChange={(event) => setProfileValue("fullLegalName", event.target.value)}
            />
          </label>
          <label>
            Preferred Name
            <input
              value={profile.preferredName}
              onChange={(event) => setProfileValue("preferredName", event.target.value)}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={profile.email}
              onChange={(event) => setProfileValue("email", event.target.value)}
            />
          </label>
          <label>
            Phone
            <input
              value={profile.phone}
              onChange={(event) => setProfileValue("phone", event.target.value)}
            />
          </label>
          <label>
            Street Address
            <input
              value={profile.streetAddress}
              onChange={(event) => setProfileValue("streetAddress", event.target.value)}
            />
          </label>
          <label>
            City
            <input
              value={profile.city}
              onChange={(event) => setProfileValue("city", event.target.value)}
            />
          </label>
          <label>
            State
            <input
              value={profile.state}
              onChange={(event) => setProfileValue("state", event.target.value)}
            />
          </label>
          <label>
            Zip
            <input
              value={profile.zip}
              onChange={(event) => setProfileValue("zip", event.target.value)}
            />
          </label>
          <label>
            Start Date
            <input
              type="date"
              value={profile.startDate}
              onChange={(event) => setProfileValue("startDate", event.target.value)}
            />
          </label>
          <label>
            Shirt Size
            <select
              value={profile.shirtSize}
              onChange={(event) => setProfileValue("shirtSize", event.target.value)}
            >
              <option value="">Select shirt size</option>
              {SHIRT_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <label>
            Manager Name
            <input
              value={profile.managerName}
              onChange={(event) => setProfileValue("managerName", event.target.value)}
            />
          </label>
          <label>
            Emergency Contact Name
            <input
              value={profile.emergencyContactName}
              onChange={(event) => setProfileValue("emergencyContactName", event.target.value)}
            />
          </label>
          <label>
            Emergency Contact Phone
            <input
              value={profile.emergencyContactPhone}
              onChange={(event) => setProfileValue("emergencyContactPhone", event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>5. Required Forms</h2>
        {profile.workerType === "" ? (
          <p className="muted">Choose worker type above to load required forms.</p>
        ) : (
          <div className="stack">
            {requiredForms.map((form) => {
              const state =
                uploadStates[form.id] ??
                ({ status: "idle", progress: 0, error: null, pendingFile: null } satisfies UploadState);
              const upload = uploadedFiles[form.id];

              return (
                <article key={form.id} className="upload-card">
                  <div className="upload-head">
                    <div>
                      <h3>{form.title}</h3>
                      <p className="muted">
                        {form.uploadHint ?? "Upload your completed and signed file."}
                      </p>
                    </div>
                    <span className={`status status-${state.status}`}>{state.status}</span>
                  </div>

                  {form.previewUrl || form.downloadUrl ? (
                    <div className="actions-row">
                      {form.previewUrl ? (
                        <a
                          className="btn-secondary"
                          href={form.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Preview
                        </a>
                      ) : null}
                      {form.downloadUrl ? (
                        <a className="btn-secondary" href={form.downloadUrl} download>
                          Download
                        </a>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="actions-row">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                          return;
                        }

                        void uploadFile(form.id, file);
                      }}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={state.status !== "error" || !state.pendingFile}
                      onClick={() => retryUpload(form.id)}
                    >
                      Retry
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={!upload && state.status === "idle"}
                      onClick={() => clearUpload(form.id)}
                    >
                      Clear
                    </button>
                  </div>

                  {state.status === "uploading" ? (
                    <p className="upload-progress">Uploading: {Math.round(state.progress)}%</p>
                  ) : null}

                  {upload ? (
                    <p className="success-text">
                      Uploaded: <strong>{upload.fileName}</strong>
                    </p>
                  ) : null}

                  {state.error ? <p className="error-text">{state.error}</p> : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>6. Review & Submit</h2>
        <div className="review-grid">
          <div>
            <h3>Profile Status</h3>
            <p className={isProfileValid ? "success-text" : "error-text"}>
              {isProfileValid ? "All required profile fields are complete." : "Some required profile fields are missing."}
            </p>
          </div>
          <div>
            <h3>Required Upload Status</h3>
            <p className={hasAllRequiredUploads ? "success-text" : "error-text"}>
              {hasAllRequiredUploads
                ? "All required forms uploaded."
                : "Missing one or more required uploads."}
            </p>
          </div>
        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={confirmationChecked}
            onChange={(event) => setConfirmationChecked(event.target.checked)}
          />
          I confirm all information is accurate and all required signed forms are uploaded.
        </label>

        <button type="button" className="btn-primary" disabled={!canSubmit} onClick={() => void handleSubmit()}>
          {isSubmitting ? "Submitting..." : "Submit Onboarding Packet"}
        </button>

        {submitError ? <p className="error-text">{submitError}</p> : null}
      </section>

      <section className="panel">
        <h2>7. Success</h2>
        <p className="muted">
          After successful submission, you will be redirected to a confirmation page showing your packet was emailed.
        </p>
      </section>

      <section className="panel small">
        <h2>Admin Notes</h2>
        <p className="muted">
          Configurable values are centralized in <code>lib/config.ts</code>. Recipient emails are set by environment variables only.
        </p>
        <p className="muted">Submission Session: {submissionId}</p>
        <p className="muted">Available forms in config: {REQUIRED_FORMS.length}</p>
      </section>
    </main>
  );
}
