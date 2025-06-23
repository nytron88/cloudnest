import { withLoggerAndErrorHandler } from "@/lib/withLoggerAndErrorHandler";
import { requireAuth } from "@/lib/requireAuth";
import { type NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/lib/responseWrapper";
import prisma from "@/lib/prisma";
import { File, mapFileType } from "@/types/file";
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

  if (bodyUserId !== userId) {
    return errorResponse("Unauthorized", 401);
  }

  const {
    name = "Untitled",
    size = 0,
    fileType: imageKitFileType,
    url = "",
    thumbnailUrl = "",
    fileId = "",
    folderId = null,
  } = imagekit;

  if (!imageKitFileType || !url) {
    return errorResponse("Missing required file data", 400);
  }

  const mappedType = mapFileType(imageKitFileType, url);

  if (!mappedType) {
    return errorResponse("Unsupported or unknown file type", 400);
  }

  let path: string;

  if (folderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { userId: true, isTrash: true, path: true },
    });

    if (!folder) {
      return errorResponse("Folder not found", 404);
    }

    if (folder.userId !== userId) {
      return errorResponse("Invalid folder ownership", 403);
    }

    if (folder.isTrash) {
      return errorResponse("Cannot upload to trash folder", 400);
    }

    path = `${folder.path}/${name}`;
  } else {
    path = `/${name}`;
  }

  const existing = await prisma.file.findFirst({
    where: {
      userId,
      path,
    },
  });

  if (existing) {
    return errorResponse(
      "A file with this name already exists in this location",
      409
    );
  }

  try {
    const file = await prisma.file.create({
      data: {
        name,
        path,
        size,
        type: mappedType,
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
    return errorResponse("Failed to save file", 500, error.message);
  }
});
