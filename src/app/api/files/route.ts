import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import prisma from "@/lib/prisma/prisma";
import { NextResponse, type NextRequest } from "next/server";
import { File } from "@/types/file";
import { PaginatedResponse } from "@/types/pagination";
import { FileSearchSchema } from "@/schemas/fileSearchSchema";
import { Prisma } from "@prisma/client";

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

  const currentPage = page ?? 1;
  const itemsPerPage = pageSize ?? 10;

  if (folderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { isTrash: true },
    });

    if (!folder) {
      return errorResponse("Folder not found", 404);
    }

    if (folder.isTrash && (isTrash === false || isTrash === undefined)) {
      return errorResponse(
        "Cannot access content of folder that is in trash. Please restore the folder first.",
        400
      );
    }
  }

  try {
    const baseWhereClause: Prisma.FileWhereInput = {
      userId,
      folderId: folderId || null,
      name: search
        ? {
            contains: search,
            mode: "insensitive" as Prisma.QueryMode,
          }
        : undefined,
      isTrash: typeof isTrash === "boolean" ? isTrash : undefined,
      isStarred: typeof isStarred === "boolean" ? isStarred : undefined,
    };

    const [files, totalCount] = await Promise.all([
      prisma.file.findMany({
        where: baseWhereClause,
        orderBy: {
          [sortBy ?? "createdAt"]: order ?? "desc",
        },
        skip: (currentPage - 1) * itemsPerPage,
        take: itemsPerPage,
      }),
      prisma.file.count({
        where: baseWhereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return successResponse<PaginatedResponse<File>>(
      "Files retrieved successfully",
      200,
      {
        data: files,
        meta: {
          totalItems: totalCount,
          currentPage: currentPage,
          pageSize: itemsPerPage,
          totalPages: totalPages,
        },
      }
    );
  } catch (error: any) {
    console.error("Failed to retrieve files:", error);
    return errorResponse(
      "There was some error fetching the files. Please try again.",
      500,
      error.message
    );
  }
});
