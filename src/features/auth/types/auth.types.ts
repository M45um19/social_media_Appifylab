import { z } from "zod";
import { ApiResponse } from "@/types/api.types";

// ============================================================================
// Registration Schema & Types
// ============================================================================

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required"),
    lastName: z
      .string()
      .min(1, "Last name is required"),
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

export interface RegisterResponseData {
  accessToken: string;
  refreshToken: string;
  deviceId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
  };
}

export type RegisterResponse = ApiResponse<RegisterResponseData>;

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
  accessToken: string;
  refreshToken: string;
  deviceId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
  };
}>;

// ============================================================================
// Logout Types
// ============================================================================

export interface LogoutInput {
  deviceId: string;
}

export type LogoutResponse = ApiResponse<null>;
