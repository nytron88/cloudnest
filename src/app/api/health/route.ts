import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse } from "@/lib/utils/responseWrapper";

export const GET = withLoggerAndErrorHandler(async () => {
  return successResponse("Health check successful", 200);
});
