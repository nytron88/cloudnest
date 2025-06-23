import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import type { NextRequest } from "next/server";
import type { StripeCheckoutSession } from "@/types/stripe";
import stripe from "@/lib/stripe/stripe";
import { requireAuth } from "@/lib/requireAuth";
import { NextResponse } from "next/server";

export const POST = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const auth = await requireAuth();

  if (auth instanceof NextResponse) return auth;

  const { sessionId } = await request.json();

  if (!sessionId) {
    return errorResponse("Session ID is required", 400);
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["customer", "subscription"],
  });

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
