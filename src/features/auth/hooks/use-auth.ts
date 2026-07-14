import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";
import { setCookie, deleteCookie } from "@/utils/cookies";
import {
  LoginInput,
  LoginResponse,
  RegisterInput,
  RegisterResponse,
  LogoutInput,
  LogoutResponse,
} from "../types/auth.types";

/**
 * Custom hook to handle login mutation lifecycle.
 */
export function useLogin() {
  const router = useRouter();

  return useMutation<LoginResponse, Error, LoginInput>({
    mutationFn: (input) => authService.login(input),
    onSuccess: (data) => {
      console.log("Login mutation succeeded:", data);
      if (data.success && data.data) {
        const { accessToken, refreshToken, deviceId, user } = data.data;
        setCookie("accessToken", accessToken, 7);
        setCookie("refreshToken", refreshToken, 30);
        setCookie("deviceId", deviceId, 365);
        setCookie("user", JSON.stringify(user), 7);
        router.push("/");
      }
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
  const router = useRouter();

  return useMutation<RegisterResponse, Error, RegisterInput>({
    mutationFn: (input) => authService.register(input),
    onSuccess: (data) => {
      console.log("Registration mutation succeeded:", data);
      if (data.success && data.data) {
        const { accessToken, refreshToken, deviceId, user } = data.data;
        setCookie("accessToken", accessToken, 7);
        setCookie("refreshToken", refreshToken, 30);
        setCookie("deviceId", deviceId, 365);
        setCookie("user", JSON.stringify(user), 7);
        router.push("/");
      }
    },
    onError: (error) => {
      console.error("Registration mutation failed:", error);
    },
  });
}

/**
 * Custom hook to handle logout mutation lifecycle.
 */
export function useLogout() {
  const router = useRouter();

  return useMutation<LogoutResponse, Error, LogoutInput>({
    mutationFn: (input) => authService.logout(input),
    onSuccess: (data) => {
      console.log("Logout mutation succeeded:", data);
      deleteCookie("accessToken");
      deleteCookie("refreshToken");
      deleteCookie("deviceId");
      deleteCookie("user");
      router.push("/login");
    },
    onError: (error) => {
      console.error("Logout mutation failed:", error);
      deleteCookie("accessToken");
      deleteCookie("refreshToken");
      deleteCookie("deviceId");
      deleteCookie("user");
      router.push("/login");
    },
  });
}
