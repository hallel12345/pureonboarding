import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from "@/lib/config";
import { validateUploadPayload } from "@/lib/upload";

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = randomUUID();

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const parsedPayload = validateUploadPayload(clientPayload);

        const requiredPrefix = `onboarding/${parsedPayload.submissionId}/${parsedPayload.formId}/`;
        if (!pathname.startsWith(requiredPrefix)) {
          throw new Error("Upload path does not match expected pattern.");
        }

        return {
          allowedContentTypes: ALLOWED_UPLOAD_MIME_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_SIZE_BYTES,
          addRandomSuffix: false,
          tokenPayload: clientPayload,
        };
      },
      onUploadCompleted: async () => {
        console.info("[upload-complete]", { requestId });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[upload-init]", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown upload error",
    });

    const errorDetail = error instanceof Error ? error.message : "Unknown upload error";
    return NextResponse.json(
      {
        error: `Upload initialization failed: ${errorDetail}`,
        requestId,
      },
      { status: 400 },
    );
  }
}
