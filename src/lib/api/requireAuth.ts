import { auth } from "@clerk/nextjs/server";
import { errorResponse } from "./responseWrapper";

export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse("Authentication required", 401);
  }

  return { userId };
}
