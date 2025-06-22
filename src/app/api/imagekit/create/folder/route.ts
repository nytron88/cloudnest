import { withLoggerAndErrorHandler } from "@/lib/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/responseWrapper";
import { requireAuth } from "@/lib/requireAuth";
import prisma from "@/lib/prisma";
import { NextResponse, type NextRequest } from "next/server";
import { Folder } from "@/types/folder";
import { FolderInputBodySchema } from "@/schemas/createFolderSchema";
import type { FolderInputBody } from "@/types/folder";

export const POST = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { userId } = auth;
  let parsedBody: FolderInputBody;

  try {
    const json = await request.json();
    const result = FolderInputBodySchema.safeParse(json);

    if (!result.success) {
      return errorResponse("Invalid request body", 400, result.error.flatten());
    }

    parsedBody = result.data;
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { folder, userId: bodyUserId } = parsedBody;

  if (bodyUserId !== userId) {
    return errorResponse("Unauthorized", 401);
  }

  const { name, parentId, isTrash = false, isStarred = false } = folder;

  let path: string;

  if (parentId) {
    const parentFolder = await prisma.folder.findUnique({
      where: { id: parentId },
      select: { userId: true, isTrash: true, path: true },
    });

    if (!parentFolder) {
      return errorResponse("Parent folder not found", 404);
    }

    if (parentFolder.userId !== userId) {
      return errorResponse("Invalid parent folder ownership", 403);
    }

    if (parentFolder.isTrash) {
      return errorResponse("Cannot create folder in trash folder", 400);
    }

    path = `${parentFolder.path}/${name}`;
  } else {
    path = `/${name}`;
  }

  try {
    const newFolder = await prisma.folder.create({
      data: {
        name,
        path,
        parentId: parentId ?? null,
        isTrash,
        isStarred,
        userId,
      },
    });

    return successResponse<Folder>(
      "Folder created successfully",
      201,
      newFolder
    );
  } catch (error: any) {
    return errorResponse("Failed to create folder", 500, error.message);
  }
});
