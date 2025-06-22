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

  if (bodyUserId !== userId) {
    return errorResponse("Unauthorized", 401);
  }

  const {
    name = "Untitled",
    size = 0,
    fileType,
    url = "",
    thumbnailUrl = "",
    fileId = "",
    folderId = null,
  } = imagekit;

  if (!fileType || !Object.values(FileType).includes(fileType)) {
    return errorResponse("Invalid or missing file type", 400);
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
    return errorResponse("Failed to save file", 500, error.message);
  }
});
