import {
  ContextWithId,
  withLoggerAndErrorHandler,
} from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import prisma from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { FileIdParamsSchema } from "@/schemas/fileIdParamsSchema";
import { slugify } from "@/lib/utils/slugify";
import { File } from "@/types/file";

async function getUniqueFileName(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  originalFullName: string,
  targetFolderId: string | null,
  userId: string
): Promise<{ name: string; path: string }> {
  let baseNameForCollision = originalFullName;
  let slugifiedBaseForPath = slugify(originalFullName, "_");

  let counter = 0;
  let uniqueFound = false;

  let basePathPrefix = "";
  if (targetFolderId) {
    const parentFolder = await tx.folder.findUnique({
      where: { id: targetFolderId },
      select: { path: true },
    });
    basePathPrefix = parentFolder?.path ? parentFolder.path + "/" : "/";
  } else {
    basePathPrefix = "/";
  }

  while (!uniqueFound) {
    const currentPath = basePathPrefix + slugifiedBaseForPath;

    const existingFile = await tx.file.findFirst({
      where: {
        userId,
        folderId: targetFolderId,
        path: currentPath,
        isTrash: false,
      },
    });

    if (!existingFile) {
      uniqueFound = true;
    } else {
      counter++;
      baseNameForCollision = `${originalFullName} (${counter})`;
      slugifiedBaseForPath = slugify(baseNameForCollision, "_");
    }
  }
  return {
    name: baseNameForCollision,
    path: basePathPrefix + slugifiedBaseForPath,
  };
}

export const PATCH = withLoggerAndErrorHandler(
  async (_, props: ContextWithId) => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;

    const parseResult = FileIdParamsSchema.safeParse(props);
    if (!parseResult.success) {
      return errorResponse("Invalid file ID", 400, parseResult.error.flatten());
    }

    const { id: fileId } = parseResult.data.params;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const file = await tx.file.findUnique({
          where: {
            id: fileId,
          },
          select: {
            userId: true,
            isTrash: true,
            name: true,
            path: true,
            folderId: true,
          },
        });

        if (!file) {
          return errorResponse("File not found", 404);
        }

        if (file.userId !== userId) {
          return errorResponse("Unauthorized", 403);
        }

        if (!file.isTrash) {
          return successResponse("File is already in normal state", 200);
        }

        const targetFolderId = file.folderId;

        const { name: uniqueName, path: uniquePath } = await getUniqueFileName(
          tx,
          file.name,
          targetFolderId,
          userId
        );

        const updatedFile = await tx.file.update({
          where: { id: fileId },
          data: {
            isTrash: false,
            name: uniqueName,
            path: uniquePath,
          },
        });

        return successResponse<File>(
          "File restored from trash successfully",
          200,
          updatedFile
        );
      });

      return result;
    } catch (error: any) {
      return errorResponse(
        "Failed to restore file from trash",
        500,
        error.message
      );
    }
  }
);
