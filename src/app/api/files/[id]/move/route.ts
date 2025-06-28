import {
  ContextWithId,
  withLoggerAndErrorHandler,
} from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import prisma from "@/lib/prisma/prisma";
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { FileIdParamsSchema } from "@/schemas/fileIdParamsSchema";
import { MoveFileSchema } from "@/schemas/moveFileSchema";
import { MoveFileBody } from "@/types/file";
import { slugify } from "@/lib/utils/slugify";

export const PATCH = withLoggerAndErrorHandler(
  async (request: NextRequest, props: ContextWithId) => {
    const auth = await requireAuth();

    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;

    const parseParams = FileIdParamsSchema.safeParse(props);

    if (!parseParams.success) {
      return errorResponse("Invalid file ID", 400, parseParams.error.flatten());
    }

    let parsedBody: MoveFileBody;

    try {
      const json = await request.json();
      const parseBody = MoveFileSchema.safeParse(json);
      if (!parseBody.success) {
        return errorResponse(
          "Invalid target folder ID in body",
          400,
          parseBody.error.flatten()
        );
      }

      parsedBody = parseBody.data;
    } catch (error) {
      return errorResponse("Invalid JSON body", 400);
    }

    const { folderId: targetFolderId } = parsedBody;

    const { id: fileId } = parseParams.data.params;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const file = await tx.file.findUnique({
          where: { id: fileId },
          select: {
            userId: true,
            isTrash: true,
            folderId: true,
            name: true,
            path: true,
          },
        });

        if (!file) return errorResponse("File not found", 404);
        if (file.userId !== userId) return errorResponse("Unauthorized", 403);
        if (file.isTrash) return errorResponse("File is in trash", 400);

        if (file.folderId === targetFolderId)
          return successResponse("File is already in the target folder", 200);

        let targetFolderPath: string;
        let finalTargetFolderId: string | null = targetFolderId;

        if (targetFolderId) {
          const targetFolder = await tx.folder.findUnique({
            where: { id: targetFolderId },
            select: { userId: true, path: true, isTrash: true },
          });

          if (!targetFolder)
            return errorResponse("Target folder not found", 404);
          if (targetFolder.userId !== userId)
            return errorResponse("Unauthorized: Target folder ownership", 403);
          if (targetFolder.isTrash)
            return errorResponse("Cannot move file into a trash folder", 400);

          targetFolderPath = targetFolder.path;

          const currentFileFolderPath = file.folderId
            ? (
                await tx.folder.findUnique({
                  where: { id: file.folderId },
                  select: { path: true },
                })
              )?.path
            : "/";

          if (
            currentFileFolderPath &&
            targetFolderPath.startsWith(currentFileFolderPath + "/")
          ) {
            return errorResponse(
              "Cannot move file into its own subfolder.",
              400
            );
          }
        } else {
          targetFolderPath = "/";
          finalTargetFolderId = null;
        }

        const pathSafeFileName = slugify(file.name, "_");
        const newPath = `${targetFolderPath}/${pathSafeFileName}`;

        const existingFile = await tx.file.findFirst({
          where: {
            path: newPath,
            userId,
            id: { not: fileId },
          },
          select: { id: true },
        });

        if (existingFile) {
          return errorResponse(
            "A file with this name already exists in the target folder. Please rename the file or move it to a different folder.",
            400
          );
        }

        await tx.file.update({
          where: { id: fileId },
          data: {
            folderId: finalTargetFolderId,
            path: newPath,
          },
        });

        return successResponse("File moved successfully", 200);
      });

      return result;
    } catch (error: any) {
      return errorResponse("Failed to move file", 500, error.message);
    }
  }
);
