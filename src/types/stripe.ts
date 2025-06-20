import type Stripe from "stripe";

export type StripeCreateCheckoutSessionResponse = {
  id: string;
};

export type StripeCheckoutSession = Stripe.Checkout.Session;

export type StripeCreatePortalSessionResponse = {
  url: string;
};
