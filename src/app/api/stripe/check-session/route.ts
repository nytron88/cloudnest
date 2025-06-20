import { withLoggerAndErrorHandler } from "@/lib/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/responseWrapper";
import type { NextRequest } from "next/server";
import type { StripeCheckoutSession } from "@/types/stripe";
import { getPlanFromPriceId } from "@/types/stripe";
import stripe from "@/lib/stripe";
import { auth } from "@clerk/nextjs/server";
import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { SubscriptionPlan } from "@prisma/client";

export const POST = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse("Unauthorized", 401);
  }

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

  const userSubscription = await prisma.subscription.findUnique({
    where: {
      userId,
    },
  });

  if (!userSubscription) {
    return errorResponse("Subscription not found", 404);
  }

  const subscription = session.subscription as Stripe.Subscription;

  await prisma.subscription.update({
    where: {
      userId,
    },
    data: {
      plan: getPlanFromPriceId(
        subscription.items.data[0].price.id
      ) as SubscriptionPlan,
      stripeCustomerId: (session.customer as Stripe.Customer).id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      currentPeriodEnd: new Date(
        subscription.items.data[0].current_period_end * 1000
      ),
    },
  });

  return successResponse<StripeCheckoutSession>(
    "Session retrieved",
    200,
    session
  );
});
