import { withLoggerAndErrorHandler } from "@/lib/withLoggerAndErrorHandler";
import { successResponse } from "@/lib/responseWrapper";

export const GET = withLoggerAndErrorHandler(async () => {
  return successResponse("Health check successful");
});
