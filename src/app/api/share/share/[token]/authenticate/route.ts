import {
  withLoggerAndErrorHandler,
  ContextWithId,
} from "@/lib/api/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/utils/responseWrapper";
import { type NextRequest } from "next/server";
import prisma from "@/lib/prisma/prisma";
import bcrypt from "bcryptjs";
import { generateShareAuthCookieHeader } from "@/lib/utils/shareAuthJwt";
import { AuthenticateShareLinkSchema } from "@/schemas/authenticateShareLinkSchema";
import { ShareTokenParamsSchema } from "@/schemas/shareTokenSchema";
import { AuthenticateShareLinkBody } from "@/types/share";

export const POST = withLoggerAndErrorHandler(
  async (request: NextRequest, props: ContextWithId) => {
    const parseParams = ShareTokenParamsSchema.safeParse(props);
    if (!parseParams.success) {
      return errorResponse(
        "Invalid share token format",
        400,
        parseParams.error.flatten()
      );
    }
    const { token } = parseParams.data.params;

    let parsedBody: AuthenticateShareLinkBody;

    try {
      const json = await request.json();
      const parseBody = AuthenticateShareLinkSchema.safeParse(json);
      if (!parseBody.success) {
        return errorResponse(
          "Invalid request body",
          400,
          parseBody.error.flatten()
        );
      }
      parsedBody = parseBody.data;
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const { password } = parsedBody;

    try {
      const sharedLink = await prisma.sharedLink.findUnique({
        where: { token },
        select: {
          expiresAt: true,
          password: true,
          fileId: true,
          folderId: true,
        },
      });

      if (!sharedLink) {
        return errorResponse("Shared link not found", 404);
      }
      if (sharedLink.expiresAt && sharedLink.expiresAt < new Date()) {
        return errorResponse("Shared link has expired", 401);
      }
      if (!sharedLink.password) {
        return errorResponse("This link does not require a password.", 400);
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        sharedLink.password
      );
      if (!isPasswordValid) {
        return errorResponse("Incorrect password", 401);
      }

      const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
      const cookiePath = `/api/share/${token.substring(0, 8)}`;

      const cookieHeader = generateShareAuthCookieHeader(
        token,
        cookiePath,
        ONE_DAY_IN_SECONDS
      );

      const response = successResponse("Authenticated successfully", 200);
      response.headers.set("Set-Cookie", cookieHeader);
      return response;
    } catch (error: any) {
      return errorResponse(
        "Failed to authenticate shared link",
        500,
        error.message
      );
    }
  }
);
