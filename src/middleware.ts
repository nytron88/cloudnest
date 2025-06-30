import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { errorResponse } from "./lib/utils/responseWrapper";
import logger from "./lib/utils/logger";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/"]);

const isPublicApiRoute = createRouteMatcher([
  "/api/webhook(.*)",
  "/api/health",
  "/api/share(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    const { userId } = await auth();
    const isApiRoute = req.nextUrl.pathname.startsWith("/api");

    if (isApiRoute) {
      if (isPublicApiRoute(req)) {
        return NextResponse.next();
      }

      if (!userId) {
        return errorResponse("Unauthorized", 401);
      }

      return NextResponse.next();
    }

    if (userId && isPublicRoute(req)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (!isPublicRoute(req)) {
      await auth.protect();
    }

    return NextResponse.next();
  } catch (error) {
    logger.error("Middleware error", {
      error: error instanceof Error ? error.message : String(error),
    });

    if (req.nextUrl.pathname.startsWith("/api")) {
      return errorResponse("Internal server error", 500);
    }

    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
