import { Subscription as PrismaSubscription } from "@prisma/client";
import type Stripe from "stripe";

export type Subscription = PrismaSubscription;

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  formattedPrice: string;
  interval: Stripe.Price.Recurring["interval"];
  price_id: string;
};
