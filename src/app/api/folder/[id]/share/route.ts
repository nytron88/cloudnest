import {
  ContextWithId,
  withLoggerAndErrorHandler,
} from "@/lib/api/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import { type NextRequest, NextResponse } from "next/server";
import { FolderIdParamsSchema } from "@/schemas/folderIdParamsSchema";
import prisma from "@/lib/prisma/prisma";
import { CreateShareLinkBody, CreateShareLinkResponse } from "@/types/share";
import { CreateShareLinkSchema } from "@/schemas/createSharedLinkSchema";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const POST = withLoggerAndErrorHandler(
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

    let parsedBody: CreateShareLinkBody;

    try {
      const json = await request.json();
      const parseBody = CreateShareLinkSchema.safeParse(json);
      if (!parseBody.success) {
        return errorResponse(
          "Invalid share link body",
          400,
          parseBody.error.flatten()
        );
      }
      parsedBody = parseBody.data;
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const { password, expiresAt } = parsedBody;

    let hashedPassword = undefined;
    if (password) {
      try {
        hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      } catch (hashError: any) {
        return errorResponse("Failed to process password", 500);
      }
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const folder = await tx.folder.findUnique({
          where: { id: folderId },
          select: { userId: true, isTrash: true },
        });

        if (!folder) {
          return errorResponse("Folder not found", 404);
        }

        if (folder.userId !== userId) {
          return errorResponse("Unauthorized", 403);
        }

        if (folder.isTrash) {
          return errorResponse("Folder is in trash and cannot be shared", 400);
        }

        const token = nanoid(32);

        await tx.sharedLink.create({
          data: {
            folderId,
            userId,
            token,
            password: hashedPassword,
            expiresAt,
          },
        });

        return successResponse<CreateShareLinkResponse>(
          "Share link created successfully",
          201,
          {
            token,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/share/${token}`,
          }
        );
      });

      return result;
    } catch (error: any) {
      return errorResponse("Failed to share folder", 500, error.message);
    }
  }
);
