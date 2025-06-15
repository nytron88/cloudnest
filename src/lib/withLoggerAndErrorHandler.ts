import { NextRequest, NextResponse } from "next/server";
import logger from "./logger";
import { errorResponse } from "./responseWrapper";
import { Prisma } from "@prisma/client";

export type ContextWithId = { params: { id: string } };

type Handler = (
  request: NextRequest,
  context: ContextWithId
) => Promise<NextResponse>;

export function withLoggerAndErrorHandler(handler: Handler): Handler {
  return async function wrappedHandler(
    request: NextRequest,
    context: ContextWithId
  ) {
    const start = Date.now();

    try {
      const response = await handler(request, context);
      const duration = Date.now() - start;

      // Only log errors and slow requests (>1s)
      if (response.status >= 400 || duration > 1000) {
        const logLevel = response.status >= 500 ? "error" : "warn";

        logger[logLevel]("Request completed", {
          method: request.method,
          url: request.nextUrl.pathname,
          status: response.status,
          responseTime: `${duration}ms`,
        });
      }

      return response;
    } catch (err: unknown) {
      const duration = Date.now() - start;
      const error = err instanceof Error ? err : new Error("Unknown error");

      logger.error("Request failed", {
        method: request.method,
        url: request.nextUrl.pathname,
        error: {
          message: error.message,
          type: error.name,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
        responseTime: `${duration}ms`,
      });

      // Handle Prisma-specific errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return errorResponse("Database error", 400, {
          code: error.code,
          message: error.message,
        });
      }

      if (error instanceof Prisma.PrismaClientValidationError) {
        return errorResponse("Invalid data provided", 400, {
          message: error.message,
        });
      }

      if (error instanceof SyntaxError) {
        return errorResponse("Invalid JSON in request body", 400, {
          message: error.message,
        });
      }

      return errorResponse("Internal Server Error", 500, {
        message: error.message,
        type: error.name,
      });
    }
  };
}
