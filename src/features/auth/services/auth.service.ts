import { apiClient } from "@/lib/api-client";
import {
  RegisterInput,
  RegisterResponse,
  LoginInput,
  LoginResponse,
} from "../types/auth.types";

export const authService = {
  /**
   * Registers a new user.
   */
  async register(input: RegisterInput): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>("/api/register", {
      email: input.email,
      password: input.password,
    });
    return response.data;
  },

  /**
   * Logs in an existing user.
   */
  async login(input: LoginInput): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/api/login", {
      email: input.email,
      password: input.password,
    });
    return response.data;
  },
};
