import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import {
  LoginInput,
  LoginResponse,
  RegisterInput,
  RegisterResponse,
} from "../types/auth.types";

/**
 * Custom hook to handle login mutation lifecycle.
 */
export function useLogin() {
  return useMutation<LoginResponse, Error, LoginInput>({
    mutationFn: (input) => authService.login(input),
    onSuccess: (data) => {
      console.log("Login mutation succeeded:", data);
    },
    onError: (error) => {
      console.error("Login mutation failed:", error);
    },
  });
}

/**
 * Custom hook to handle registration mutation lifecycle.
 */
export function useRegister() {
  return useMutation<RegisterResponse, Error, RegisterInput>({
    mutationFn: (input) => authService.register(input),
    onSuccess: (data) => {
      console.log("Registration mutation succeeded:", data);
    },
    onError: (error) => {
      console.error("Registration mutation failed:", error);
    },
  });
}
