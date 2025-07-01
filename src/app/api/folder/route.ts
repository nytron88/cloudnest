import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import prisma from "@/lib/prisma/prisma";
import { NextResponse, type NextRequest } from "next/server";
import { Folder } from "@/types/folder";
import { FolderInputSchema } from "@/schemas/createFolderSchema";
import type { FolderInputBody } from "@/types/folder";
import { slugify } from "@/lib/utils/slugify";
import { PaginatedResponse } from "@/types/pagination";
import { Prisma } from "@prisma/client";
import { FolderSearchSchema } from "@/schemas/folderSearchSchema";

export const GET = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { userId } = auth;

  const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());

  const parseResult = FolderSearchSchema.safeParse(rawQuery);

  if (!parseResult.success) {
    return errorResponse(
      "Invalid search params",
      400,
      parseResult.error.flatten()
    );
  }

  const {
    parentId,
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

  try {
    let searchMode: Prisma.QueryMode = "insensitive";

    const baseWhereClause = {
      userId,
      parentId: parentId ?? undefined,
      name: search
        ? {
            contains: search,
            mode: searchMode,
          }
        : undefined,
      isTrash: typeof isTrash === "boolean" ? isTrash : undefined,
      isStarred: typeof isStarred === "boolean" ? isStarred : undefined,
    };

    const [folders, totalCount] = await Promise.all([
      prisma.folder.findMany({
        where: baseWhereClause,
        orderBy: {
          [sortBy ?? "createdAt"]: order ?? "desc",
        },
        skip: (currentPage - 1) * itemsPerPage,
        take: itemsPerPage,
      }),
      prisma.folder.count({
        where: baseWhereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return successResponse<PaginatedResponse<Folder>>(
      "Folders retrieved successfully",
      200,
      {
        data: folders,
        meta: {
          totalItems: totalCount,
          currentPage: currentPage,
          pageSize: itemsPerPage,
          totalPages: totalPages,
        },
      }
    );
  } catch (error: any) {
    return errorResponse("Failed to retrieve folders", 500, error.message);
  }
});

export const POST = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { userId } = auth;

  let parsedBody: FolderInputBody;

  try {
    const json = await request.json();
    const result = FolderInputSchema.safeParse(json);

    if (!result.success) {
      return errorResponse("Invalid request body", 400, result.error.flatten());
    }

    parsedBody = result.data;
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { name, parentId } = parsedBody;

  try {
    const result = await prisma.$transaction(async (tx) => {
      let path: string;

      if (parentId) {
        const parentFolder = await tx.folder.findUnique({
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

        path = `${parentFolder.path}/${slugify(name, "_")}`;
      } else {
        path = `/${slugify(name, "_")}`;
      }

      const existing = await tx.folder.findFirst({
        where: {
          userId,
          path,
        },
      });

      if (existing) {
        return errorResponse(
          "A folder with this name already exists here",
          409
        );
      }

      const newFolder = await tx.folder.create({
        data: {
          name,
          path,
          parentId: parentId ?? null,
          userId,
        },
      });

      return successResponse<Folder>(
        "Folder created successfully",
        201,
        newFolder
      );
    });

    return result;
  } catch (error: any) {
    return errorResponse("Failed to create folder", 500, error.message);
  }
});
