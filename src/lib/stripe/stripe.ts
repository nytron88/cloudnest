import Stripe from "stripe";

declare global {
  var stripe: Stripe | undefined;
}

const stripe =
  process.env.NODE_ENV === "production"
    ? new Stripe(process.env.STRIPE_SECRET_KEY!)
    : global.stripe ?? new Stripe(process.env.STRIPE_SECRET_KEY!);

if (process.env.NODE_ENV !== "production") {
  global.stripe = stripe;
}

export default stripe;
