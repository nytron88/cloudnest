import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { requireAuth } from "@/lib/api/requireAuth";
import { type NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/lib/utils/responseWrapper";
import prisma from "@/lib/prisma/prisma";
import { File, mapFileType } from "@/types/file";
import { FileUploadBody } from "@/types/imagekit";
import { FileUploadSchema } from "@/schemas/imagekitUploadSchema";
import { safeDeleteFile } from "@/lib/imagekit/safeDeleteFile";
import {
  PRO_MAX_FILE_SIZE_BYTES,
  PRO_MAX_STORAGE_BYTES,
  FREE_MAX_FILE_SIZE_BYTES,
  FREE_MAX_STORAGE_BYTES,
} from "@/lib/utils/constants";

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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      usedStorage: true,
      subscription: { select: { plan: true, status: true } },
    },
  });

  if (!user) {
    await safeDeleteFile(fileId, { method: "POST", url: request.url });
    return errorResponse("User not found", 404);
  }

  const isPro =
    user.subscription?.status === "ACTIVE" &&
    (user.subscription.plan === "PRO_MONTHLY" ||
      user.subscription.plan === "PRO_YEARLY");

  const maxFileSize = isPro
    ? PRO_MAX_FILE_SIZE_BYTES
    : FREE_MAX_FILE_SIZE_BYTES;

  const maxStorage = isPro ? PRO_MAX_STORAGE_BYTES : FREE_MAX_STORAGE_BYTES;

  if (size > maxFileSize) {
    await safeDeleteFile(fileId, { method: "POST", url: request.url });

    return errorResponse(
      `File exceeds the ${isPro ? "Pro" : "Free"} plan file size limit.`,
      413
    );
  }

  if (user.usedStorage + size > maxStorage) {
    await safeDeleteFile(fileId, { method: "POST", url: request.url });

    return errorResponse(
      `You don't have enough storage left to upload this file.`,
      507
    );
  }

  const mappedType = mapFileType(imageKitFileType, url);

  if (!mappedType) {
    await safeDeleteFile(fileId, { method: "POST", url: request.url });

    return errorResponse("Unsupported or unknown file type", 400);
  }

  let path: string;

  if (folderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { userId: true, isTrash: true, path: true },
    });

    if (!folder) {
      await safeDeleteFile(fileId, { method: "POST", url: request.url });
      return errorResponse("Folder not found", 404);
    }

    if (folder.userId !== userId) {
      await safeDeleteFile(fileId, { method: "POST", url: request.url });
      return errorResponse("Invalid folder ownership", 403);
    }

    if (folder.isTrash) {
      await safeDeleteFile(fileId, { method: "POST", url: request.url });
      return errorResponse("Cannot upload to trash folder", 400);
    }

    path = `${folder.path}/${name}`;
  } else {
    path = `/${name}`;
  }

  const existing = await prisma.file.findFirst({
    where: { userId, path },
  });

  if (existing) {
    await safeDeleteFile(fileId, { method: "POST", url: request.url });
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

    await prisma.user.update({
      where: { id: userId },
      data: {
        usedStorage: {
          increment: size,
        },
      },
    });

    return successResponse<File>("File saved successfully", 200, file);
  } catch (error: any) {
    await safeDeleteFile(fileId, { method: "POST", url: request.url });
    return errorResponse("Failed to save file", 500, error.message);
  }
});
