import { describe, expect, it } from "vitest";
import {
  buildSubmissionEmailText,
  ensureRequiredUploadsPresent,
  validateSubmissionPayload,
} from "@/lib/submit-service";

const basePayload = {
  profile: {
    fullLegalName: "John Employee",
    preferredName: "John",
    email: "john@example.com",
    phone: "8015551212",
    streetAddress: "123 Main",
    city: "Provo",
    state: "UT",
    zip: "84604",
    startDate: "2026-04-20",
    shirtSize: "L",
    managerName: "Manager Name",
    emergencyContactName: "Emergency Contact",
    emergencyContactPhone: "8015553333",
    workerType: "1099",
    employerEntity: "pure-pest-ut",
    workLocationState: "UT",
  },
  uploads: {
    w9: {
      formId: "w9",
      fileName: "w9.pdf",
      blobUrl: "https://example.com/w9.pdf",
      size: 100,
      mimeType: "application/pdf",
      uploadedAt: "2026-04-13T00:00:00.000Z",
    },
    direct_deposit: {
      formId: "direct_deposit",
      fileName: "direct-deposit.pdf",
      blobUrl: "https://example.com/direct-deposit.pdf",
      size: 120,
      mimeType: "application/pdf",
      uploadedAt: "2026-04-13T00:00:00.000Z",
    },
  },
  confirmation: true,
};

describe("submission validation", () => {
  it("validates a complete payload", () => {
    const parsed = validateSubmissionPayload(basePayload);
    expect(parsed.profile.fullLegalName).toBe("John Employee");
  });

  it("throws when required upload is missing", () => {
    const parsed = validateSubmissionPayload({
      ...basePayload,
      uploads: {
        w9: basePayload.uploads.w9,
      },
    });

    expect(() => ensureRequiredUploadsPresent(parsed)).toThrow("Missing required uploads");
  });

  it("builds email body with upload links", () => {
    const parsed = validateSubmissionPayload(basePayload);
    const emailText = buildSubmissionEmailText(parsed);

    expect(emailText).toContain("John Employee");
    expect(emailText).toContain("https://example.com/w9.pdf");
    expect(emailText).toContain("https://example.com/direct-deposit.pdf");
  });
});
