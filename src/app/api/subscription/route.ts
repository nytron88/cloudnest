import { getUserSubscription } from "@/lib/actions/getUserSubscription.server";
import { successResponse, errorResponse } from "@/lib/responseWrapper";
import { Subscription } from "@/types/subscription";
import { withLoggerAndErrorHandler } from "@/lib/withLoggerAndErrorHandler";

export const GET = withLoggerAndErrorHandler(async () => {
  const subscription = await getUserSubscription();

  if (!subscription) {
    return errorResponse(
      "Something went wrong as we couldn't find your subscription. Please contact support.",
      404
    );
  }

  return successResponse<Subscription>("Subscription found", 200, subscription);
});
