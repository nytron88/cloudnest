import { withLoggerAndErrorHandler } from "@/lib/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/responseWrapper";
import { NextResponse } from "next/server";
import imagekit from "@/lib/imagekit";
import { requireAuth } from "@/lib/requireAuth";
import { ImageKitAuthParams } from "@/types/imagekit";

export const GET = withLoggerAndErrorHandler(async () => {
  const auth = await requireAuth();

  if (auth instanceof NextResponse) return auth;
  try {
    const authParams =
      imagekit.getAuthenticationParameters() as ImageKitAuthParams;

    return successResponse<ImageKitAuthParams>(
      "Fetched imagekit auth params successfully",
      200,
      authParams
    );
  } catch (error: any) {
    return errorResponse(
      "Failed to fetch imagekit auth params",
      500,
      error.message
    );
  }
});
