import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import stripe from "@/lib/stripe/stripe";
import { StripeCreatePortalSessionResponse } from "@/types/stripe";
import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { requireAuth } from "@/lib/api/requireAuth";

export const POST = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const auth = await requireAuth();

  if (auth instanceof NextResponse) return auth;

  const { userId } = auth;

  const userSubscription = await prisma.subscription.findUnique({
    where: {
      userId,
    },
  });

  if (!userSubscription) {
    return errorResponse(
      "There is no subscription for this user. Please contact support.",
      404
    );
  }

  if (!userSubscription.stripeCustomerId) {
    return errorResponse("User has no stripe customer ID", 400);
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: userSubscription.stripeCustomerId,
    return_url: `${origin}/dashboard`,
  });

  return successResponse<StripeCreatePortalSessionResponse>(
    "Portal session created",
    200,
    {
      url: session.url,
    }
  );
});
