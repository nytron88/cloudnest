import {
  ContextWithId,
  withLoggerAndErrorHandler,
} from "@/lib/api/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import { type NextRequest, NextResponse } from "next/server";
import { FolderIdParamsSchema } from "@/schemas/folderIdParamsSchema";
import { RenameFolderSchema } from "@/schemas/renameFolderSchema";
import prisma from "@/lib/prisma/prisma";
import { RenameFolderBody } from "@/types/folder";
import { slugify } from "@/lib/utils/slugify";

export const PATCH = withLoggerAndErrorHandler(
  async (request: NextRequest, props: ContextWithId) => {
    const auth = await requireAuth();

    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;

    const parseResult = FolderIdParamsSchema.safeParse(props);

    if (!parseResult.success) {
      return errorResponse(
        "Invalid folder ID",
        400,
        parseResult.error.flatten()
      );
    }

    const { id: folderId } = parseResult.data.params;

    let parsedBody: RenameFolderBody;

    try {
      const json = await request.json();
      const parseBody = RenameFolderSchema.safeParse(json);
      if (!parseBody.success) {
        return errorResponse(
          "Invalid folder name",
          400,
          parseBody.error.flatten()
        );
      }
      parsedBody = parseBody.data;
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const { name: newName } = parsedBody;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const folder = await tx.folder.findUnique({
          where: { id: folderId },
          select: {
            userId: true,
            isTrash: true,
            path: true,
            name: true,
          },
        });

        if (!folder) {
          return errorResponse("Folder not found", 404);
        }

        if (folder.userId !== userId) {
          return errorResponse("Unauthorized", 403);
        }

        if (folder.isTrash) {
          return errorResponse(
            "Folder is in trash. Please restore the folder first.",
            400
          );
        }

        if (folder.name === newName) {
          return successResponse("Folder already has this name", 200);
        }

        const lastSlashIndex = folder.path.lastIndexOf("/");

        const pathSafeName = slugify(newName, "_");

        const newPath =
          lastSlashIndex !== -1
            ? folder.path.slice(0, lastSlashIndex + 1) + pathSafeName
            : pathSafeName;

        const existingFolder = await tx.folder.findFirst({
          where: {
            path: newPath,
            userId,
            id: { not: folderId },
          },
          select: { id: true },
        });

        if (existingFolder) {
          return errorResponse(
            "A folder with this name already exists in the folder",
            400
          );
        }

        await tx.folder.update({
          where: { id: folderId },
          data: { name: newName, path: newPath },
        });

        return successResponse("Folder renamed successfully", 200);
      });

      return result;
    } catch (error: any) {
      return errorResponse("Failed to rename folder", 500, error.message);
    }
  }
);
