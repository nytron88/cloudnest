import { z } from "zod";

export const signupSchema = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Enter a valid email address"),

    firstName: z
      .string({ required_error: "First name is required" })
      .min(1, "First name must be at least 1 character")
      .max(30, "First name must be at most 30 characters"),

    lastName: z
      .string({ required_error: "Last name is required" })
      .min(1, "Last name must be at least 1 character")
      .max(30, "Last name must be at most 30 characters"),

    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(64, "Password must be at most 64 characters"),

    confirmPassword: z
      .string({ required_error: "Confirm password is required" })
      .min(8, "Confirm password must be at least 8 characters")
      .max(64, "Confirm password must be at most 64 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
