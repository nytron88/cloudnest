import { NextResponse } from "next/server";
import { APIResponse } from "@/types/apiResponse";

export function successResponse<T>(
  message = "Request successful",
  data?: T,
  status = 200
) {
  const responseBody: APIResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
  };

  return NextResponse.json(responseBody, { status });
}

export function errorResponse<E = unknown>(
  message = "Something went wrong",
  status = 500,
  errors?: E
) {
  const responseBody: APIResponse<null, E> =
    typeof errors === "object" && errors !== null
      ? {
          success: false,
          message,
          errors,
        }
      : {
          success: false,
          message,
        };

  return NextResponse.json(responseBody, { status });
}
