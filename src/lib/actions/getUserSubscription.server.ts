import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getUserSubscription() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const subscription = await prisma.subscription.findUnique({
    where: {
      userId: userId,
    },
  });

  return subscription;
}
