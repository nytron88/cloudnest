import { withLoggerAndErrorHandler } from "@/lib/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/responseWrapper";
import stripe from "@/lib/stripe";
import { StripeCreatePortalSessionResponse } from "@/types/stripe";
import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export const POST = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse("User ID is required", 400);
  }

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
