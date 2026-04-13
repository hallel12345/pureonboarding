import { describe, expect, it } from "vitest";
import { validateUploadPayload } from "@/lib/upload";

describe("upload payload validation", () => {
  it("accepts valid payload", () => {
    const payload = validateUploadPayload(
      JSON.stringify({
        submissionId: "abc123456789",
        formId: "w9",
        originalFileName: "signed-w9.pdf",
        size: 5000,
        mimeType: "application/pdf",
      }),
    );

    expect(payload.formId).toBe("w9");
  });

  it("rejects unsupported file extensions", () => {
    expect(() =>
      validateUploadPayload(
        JSON.stringify({
          submissionId: "abc123456789",
          formId: "w9",
          originalFileName: "signed-w9.exe",
          size: 5000,
          mimeType: "application/pdf",
        }),
      ),
    ).toThrow("Unsupported file extension");
  });
});
