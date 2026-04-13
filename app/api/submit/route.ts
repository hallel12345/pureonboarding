import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { sendSubmissionEmail } from "@/lib/email";
import {
  buildSubmissionEmailText,
  ensureRequiredUploadsPresent,
  validateSubmissionPayload,
} from "@/lib/submit-service";

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = randomUUID();
  let payload: ReturnType<typeof validateSubmissionPayload> | null = null;

  try {
    const rawPayload = (await request.json()) as unknown;
    payload = validateSubmissionPayload(rawPayload);
    ensureRequiredUploadsPresent(payload);
  } catch (error) {
    console.error("[submit-validate]", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown validation error",
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Submission validation failed. Please review your form.",
        requestId,
      },
      { status: 400 },
    );
  }

  try {
    await sendSubmissionEmail(payload);

    console.info("[submit-success]", {
      requestId,
      workerType: payload.profile.workerType,
      email: payload.profile.email,
      uploadCount: Object.keys(payload.uploads).length,
    });

    return NextResponse.json({ success: true, requestId });
  } catch (error) {
    console.error("[smtp-send]", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown submit error",
    });

    return NextResponse.json(
      {
        error:
          "We could not send your onboarding packet right now. Please retry in a moment.",
        requestId,
      },
      { status: 500 },
    );
  }
}

export function _buildEmailPreviewForTests(payload: Parameters<typeof validateSubmissionPayload>[0]) {
  return buildSubmissionEmailText(validateSubmissionPayload(payload));
}
