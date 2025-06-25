import {
  withLoggerAndErrorHandler,
  ContextWithId,
} from "@/lib/api/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import { type NextRequest, NextResponse } from "next/server";
import { FileIdParamsSchema } from "@/schemas/fileIdParamsSchema";
import { CreateShareLinkSchema } from "@/schemas/createSharedLinkSchema";
import { CreateShareLinkBody, CreateShareLinkResponse } from "@/types/share";
import prisma from "@/lib/prisma/prisma";
import { nanoid } from "nanoid";

export const POST = withLoggerAndErrorHandler(
  async (request: NextRequest, props: ContextWithId) => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;

    const parseParams = FileIdParamsSchema.safeParse(props);
    if (!parseParams.success) {
      return errorResponse("Invalid file ID", 400, parseParams.error.flatten());
    }

    const { id: fileId } = parseParams.data.params;

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

    try {
      const existingFile = await prisma.file.findUnique({
        where: { id: fileId, userId },
      });

      if (!existingFile) {
        return errorResponse("File not found", 404);
      }

      const token = nanoid(32);

      await prisma.sharedLink.create({
        data: {
          fileId,
          userId,
          token,
          password,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        },
      });

      return successResponse<CreateShareLinkResponse>(
        "Shared link created",
        201,
        {
          token,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/share/${token}`,
        }
      );
    } catch (error: any) {
      return errorResponse("Error creating shared link", 500, {
        error: error.message,
      });
    }
  }
);
