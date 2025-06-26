import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import { NextResponse, type NextRequest } from "next/server";
import { FileSearchSchema } from "@/schemas/fileSearchSchema";
import prisma from "@/lib/prisma/prisma";
import { File } from "@/types/file";

export const GET = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const auth = await requireAuth();

  if (auth instanceof NextResponse) return auth;

  const { userId } = auth;

  const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());

  const parseResult = FileSearchSchema.safeParse(rawQuery);

  if (!parseResult.success) {
    return errorResponse(
      "Invalid search parameters",
      400,
      parseResult.error.flatten()
    );
  }

  const {
    folderId,
    search,
    page,
    pageSize,
    sortBy,
    order,
    isTrash,
    isStarred,
  } = parseResult.data;

  if (folderId && isTrash) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { isTrash: true },
    });

    if (folder?.isTrash) {
      return errorResponse(
        "Cannot search in folder that is in trash. Please restore the folder first.",
        400
      );
    }
  }

  try {
    const files = await prisma.file.findMany({
      where: {
        userId,
        folderId: folderId || null,
        name: search ? { contains: search, mode: "insensitive" } : undefined,
        isTrash: isTrash ?? false,
        isStarred: isStarred ?? false,
      },
      orderBy: {
        [sortBy ?? "createdAt"]: order ?? "desc",
      },
      skip: page && pageSize ? (page - 1) * pageSize : undefined,
      take: pageSize,
    });

    return successResponse<File[]>("Files retrieved successfully", 200, files);
  } catch (error: any) {
    return errorResponse(
      "There was some error fetching the files. Please try again.",
      500,
      error.message
    );
  }
});
