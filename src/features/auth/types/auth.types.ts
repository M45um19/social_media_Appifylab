import { z } from "zod";
import { ApiResponse } from "@/types/api.types";

// ============================================================================
// Registration Schema & Types
// ============================================================================

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address format"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please repeat your password"),
    agreeTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: "You must agree to the terms & conditions",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export type RegisterResponse = ApiResponse<unknown>;

// ============================================================================
// Login Schema & Types
// ============================================================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export type LoginResponse = ApiResponse<{
  token?: string;
  user?: {
    email: string;
  };
}>;
