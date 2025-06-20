import { NextResponse } from "next/server";
import { APIResponse } from "@/types/apiResponse";

export function successResponse<T>(
  message = "Request successful",
  status = 200,
  payload?: T
) {
  const responseBody: APIResponse<T> = {
    success: true,
    message,
    ...(payload !== undefined && { payload }),
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
