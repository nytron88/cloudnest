import { withLoggerAndErrorHandler } from "@/lib/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/responseWrapper";
import type { NextRequest } from "next/server";
import type { StripeCheckoutSession } from "@/types/stripe";
import stripe from "@/lib/stripe";

export const POST = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const { sessionId } = await request.json();

  if (!sessionId) {
    return errorResponse("Session ID is required", 400);
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session) {
    return errorResponse("Session not found", 404);
  }

  if (session.status !== "complete") {
    return errorResponse("Session is not complete", 400);
  }

  if (session.payment_status !== "paid") {
    return errorResponse("Session is not paid", 400);
  }

  return successResponse<StripeCheckoutSession>(
    "Session retrieved",
    200,
    session
  );
});
