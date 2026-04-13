"use client";

import { upload } from "@vercel/blob/client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EMPLOYER_ENTITY_OPTIONS,
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

type StepId =
  | "welcome"
  | "worker-type"
  | "employer-location"
  | "profile"
  | "uploads"
  | "review";

type StepDef = { id: StepId; title: string };

const ALL_STEPS: StepDef[] = [
  { id: "welcome", title: "Welcome" },
  { id: "worker-type", title: "Worker Type" },
  { id: "employer-location", title: "Entity & Location" },
  { id: "profile", title: "Your Information" },
  { id: "uploads", title: "Required Forms" },
  { id: "review", title: "Review & Submit" },
];

function getStepsForWorkerType(workerType: WorkerType | ""): StepDef[] {
  if (workerType === "1099") {
    return ALL_STEPS.filter((step) => step.id !== "employer-location");
  }
  return ALL_STEPS;
}

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
  const [stepIndex, setStepIndex] = useState(0);
  const [profile, setProfile] = useState<ProfileFormData>(INITIAL_PROFILE);
  const [uploadedFiles, setUploadedFiles] = useState<
    Partial<Record<FormId, UploadedFormFile>>
  >({});
  const [uploadStates, setUploadStates] = useState<Partial<Record<FormId, UploadState>>>({});
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = useMemo(
    () => getStepsForWorkerType(profile.workerType),
    [profile.workerType],
  );
  const safeStepIndex = Math.min(stepIndex, steps.length - 1);
  const currentStep = steps[safeStepIndex];

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

  const stepIsComplete = ((): boolean => {
    switch (currentStep.id) {
      case "welcome":
        return true;
      case "worker-type":
        return profile.workerType !== "";
      case "employer-location":
        return profile.employerEntity !== "" && profile.workLocationState !== "";
      case "profile":
        return isProfileValid;
      case "uploads":
        return hasAllRequiredUploads;
      case "review":
        return (
          isProfileValid && hasAllRequiredUploads && confirmationChecked && !isSubmitting
        );
    }
  })();

  const isLastStep = safeStepIndex === steps.length - 1;
  const isFirstStep = safeStepIndex === 0;

  function setProfileValue<K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) {
    setProfile((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "workerType") {
        const matchingEntity = EMPLOYER_ENTITY_OPTIONS.filter((entity) =>
          entity.forWorkerTypes.includes(value as WorkerType),
        );
        const currentStillValid = matchingEntity.some(
          (entity) => entity.value === prev.employerEntity,
        );
        if (!currentStillValid) {
          next.employerEntity = matchingEntity.length === 1 ? matchingEntity[0].value : "";
        }
        if (value === "1099") {
          next.workLocationState = "";
        }
      }
      if (key === "workLocationState" && value) {
        const matchedByLocation = EMPLOYER_ENTITY_OPTIONS.find(
          (entity) =>
            entity.locationState === value &&
            entity.forWorkerTypes.includes(next.workerType as WorkerType),
        );
        if (matchedByLocation) {
          next.employerEntity = matchedByLocation.value;
        }
      }
      return next;
    });
  }

  const inferredEntityForLocation = useMemo(() => {
    if (profile.workerType !== "w2" || !profile.workLocationState) return null;
    return (
      EMPLOYER_ENTITY_OPTIONS.find(
        (entity) =>
          entity.locationState === profile.workLocationState &&
          entity.forWorkerTypes.includes("w2"),
      ) ?? null
    );
  }, [profile.workerType, profile.workLocationState]);

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

  function goNext() {
    if (!stepIsComplete || isLastStep) {
      return;
    }
    setStepIndex((i) => i + 1);
    scrollToTop();
  }

  function goBack() {
    if (isFirstStep) {
      return;
    }
    setStepIndex((i) => i - 1);
    scrollToTop();
  }

  function scrollToTop() {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleSubmit() {
    if (!stepIsComplete) {
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

  const progressPercent = Math.round(((safeStepIndex + 1) / steps.length) * 100);

  return (
    <main className="shell">
      <section className="page-header">
        <p className="eyebrow">
          Step {safeStepIndex + 1} of {steps.length}
        </p>
        <h1>{currentStep.title}</h1>
      </section>

      <div className="progress-track" aria-hidden>
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <ol className="step-dots" aria-label="Onboarding progress">
        {steps.map((s, i) => (
          <li
            key={s.id}
            className={
              i < safeStepIndex
                ? "step-dot done"
                : i === safeStepIndex
                  ? "step-dot active"
                  : "step-dot"
            }
            aria-current={i === safeStepIndex ? "step" : undefined}
          >
            <span className="step-dot-num">{i + 1}</span>
            <span className="step-dot-label">{s.title}</span>
          </li>
        ))}
      </ol>

      <section className="panel step-panel">
        {currentStep.id === "welcome" && (
          <div className="stack">
            <h2>Let&rsquo;s get you onboarded</h2>
            <p className="subtitle" style={{ marginTop: 0 }}>
              This short flow collects your information and required forms, then sends
              everything to payroll and accounting. It takes about 10&ndash;15 minutes.
            </p>
            <ul className="instruction-list">
              <li>Pick your worker type &mdash; 1099 Sales Rep or W-2 Employee.</li>
              <li>Fill in your personal and emergency contact info.</li>
              <li>Download, complete, sign, and upload each required form.</li>
              <li>Review and submit &mdash; you&rsquo;ll get a confirmation when it&rsquo;s sent.</li>
            </ul>
            <p className="muted small">
              Have your driver&rsquo;s license, bank routing info, and any employer forms ready
              before you start.
            </p>
          </div>
        )}

        {currentStep.id === "worker-type" && (
          <div className="stack">
            <p className="subtitle" style={{ marginTop: 0 }}>
              Choose the option that matches your role. This controls which forms you&rsquo;ll upload next.
            </p>
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
          </div>
        )}

        {currentStep.id === "employer-location" && (
          <div className="stack">
            <p className="subtitle" style={{ marginTop: 0 }}>
              Which state will you be working in? Your employer entity is assigned
              automatically based on your selection.
            </p>
            <div>
              <h3 className="field-heading">Work State</h3>
              <div className="grid-two">
                {WORK_LOCATION_OPTIONS.map((location) => (
                  <button
                    key={location.value}
                    type="button"
                    className={
                      profile.workLocationState === location.value ? "choice selected" : "choice"
                    }
                    onClick={() => setProfileValue("workLocationState", location.value)}
                  >
                    {location.label}
                  </button>
                ))}
              </div>
            </div>

            {inferredEntityForLocation ? (
              <p className="muted small entity-note">
                Employer entity: <strong>{inferredEntityForLocation.label}</strong>
              </p>
            ) : null}
          </div>
        )}

        {currentStep.id === "profile" && (
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
        )}

        {currentStep.id === "uploads" && (
          <div className="stack">
            <p className="subtitle" style={{ marginTop: 0 }}>
              Download each form, fill it out, sign it, then upload the completed file.
              PDFs, PNGs, or JPGs are accepted.
            </p>
            {requiredForms.map((form) => {
              const state =
                uploadStates[form.id] ??
                ({ status: "idle", progress: 0, error: null, pendingFile: null } satisfies UploadState);
              const uploaded = uploadedFiles[form.id];

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
                      disabled={!uploaded && state.status === "idle"}
                      onClick={() => clearUpload(form.id)}
                    >
                      Clear
                    </button>
                  </div>

                  {state.status === "uploading" ? (
                    <p className="upload-progress">Uploading: {Math.round(state.progress)}%</p>
                  ) : null}

                  {uploaded ? (
                    <p className="success-text">
                      Uploaded: <strong>{uploaded.fileName}</strong>
                    </p>
                  ) : null}

                  {state.error ? <p className="error-text">{state.error}</p> : null}
                </article>
              );
            })}
          </div>
        )}

        {currentStep.id === "review" && (
          <div className="stack">
            <p className="subtitle" style={{ marginTop: 0 }}>
              Take a second to make sure everything looks right before you submit.
            </p>

            <div className="review-grid">
              <div>
                <h3>Profile</h3>
                <p className={isProfileValid ? "success-text" : "error-text"}>
                  {isProfileValid
                    ? "All required profile fields are complete."
                    : "Some required profile fields are missing."}
                </p>
              </div>
              <div>
                <h3>Uploads</h3>
                <p className={hasAllRequiredUploads ? "success-text" : "error-text"}>
                  {hasAllRequiredUploads
                    ? "All required forms uploaded."
                    : "Missing one or more required uploads."}
                </p>
              </div>
            </div>

            <dl className="summary-list">
              <div>
                <dt>Name</dt>
                <dd>{profile.fullLegalName || "\u2014"}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{profile.email || "\u2014"}</dd>
              </div>
              <div>
                <dt>Worker Type</dt>
                <dd>
                  {WORKER_TYPE_OPTIONS.find((o) => o.value === profile.workerType)?.label ??
                    "\u2014"}
                </dd>
              </div>
              <div>
                <dt>Entity</dt>
                <dd>
                  {EMPLOYER_ENTITY_OPTIONS.find((o) => o.value === profile.employerEntity)
                    ?.label ?? "\u2014"}
                </dd>
              </div>
              <div>
                <dt>Start Date</dt>
                <dd>{profile.startDate || "\u2014"}</dd>
              </div>
              {profile.workerType === "w2" ? (
                <div>
                  <dt>Work Location</dt>
                  <dd>
                    {WORK_LOCATION_OPTIONS.find((o) => o.value === profile.workLocationState)
                      ?.label ?? "\u2014"}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Uploads</dt>
                <dd>
                  {requiredForms.length > 0
                    ? `${Object.keys(uploadedFiles).length} / ${requiredForms.length} complete`
                    : "\u2014"}
                </dd>
              </div>
            </dl>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={confirmationChecked}
                onChange={(event) => setConfirmationChecked(event.target.checked)}
              />
              I confirm all information is accurate and all required signed forms are uploaded.
            </label>

            {submitError ? <p className="error-text">{submitError}</p> : null}
          </div>
        )}
      </section>

      <nav className="step-nav" aria-label="Step navigation">
        <button
          type="button"
          className="btn-secondary"
          onClick={goBack}
          disabled={isFirstStep || isSubmitting}
        >
          Back
        </button>

        {isLastStep ? (
          <button
            type="button"
            className="btn-primary"
            disabled={!stepIsComplete}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? "Submitting..." : "Submit Onboarding Packet"}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={goNext}
            disabled={!stepIsComplete}
          >
            Continue
          </button>
        )}
      </nav>
    </main>
  );
}
