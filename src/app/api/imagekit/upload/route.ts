import { withLoggerAndErrorHandler } from "@/lib/withLoggerAndErrorHandler";
import { requireAuth } from "@/lib/requireAuth";
import { type NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/lib/responseWrapper";
import prisma from "@/lib/prisma";
import { File, FileType } from "@/types/file";
import { FileUploadBody } from "@/types/imagekit";
import { FileUploadSchema } from "@/schemas/imagekitUploadSchema";

export const POST = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { userId } = auth;

  let parsedBody: FileUploadBody;

  try {
    const json = await request.json();
    const result = FileUploadSchema.safeParse(json);

    if (!result.success) {
      return errorResponse("Invalid request body", 400, result.error.flatten());
    }

    parsedBody = result.data;
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { imagekit, userId: bodyUserId } = parsedBody;

  if (!imagekit || typeof imagekit !== "object") {
    return errorResponse("Missing or invalid 'imagekit' field", 400);
  }

  if (!bodyUserId || bodyUserId !== userId) {
    return errorResponse("Unauthorized", 401);
  }

  const {
    name = "Untitled",
    path = "Untitled",
    size = 0,
    fileType,
    url = "",
    thumbnailUrl = "",
    fileId = "",
    folderId = "",
  } = imagekit;

  if (!fileType || !Object.values(FileType).includes(fileType)) {
    return errorResponse("Invalid or missing file type", 400);
  }

  try {
    const file = await prisma.file.create({
      data: {
        name,
        path,
        size,
        type: fileType,
        isTrash: false,
        isStarred: false,
        fileUrl: url,
        thumbnailUrl,
        imagekitFileId: fileId,
        folderId,
        userId,
      },
    });

    return successResponse<File>("File saved successfully", 200, file);
  } catch (error: any) {
    return errorResponse(
      "Internal error: failed to save file",
      500,
      error?.message
    );
  }
});
