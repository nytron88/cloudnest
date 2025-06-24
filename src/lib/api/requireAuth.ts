import { auth } from "@clerk/nextjs/server";
import { errorResponse } from "@/lib/utils/responseWrapper";
import { NextResponse } from "next/server";

export async function requireAuth(): Promise<
  { userId: string } | NextResponse
> {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse("Authentication required", 401);
  }

  return { userId };
}
