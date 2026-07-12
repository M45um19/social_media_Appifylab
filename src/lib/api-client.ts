import axios from "axios";
import { env } from "@/config/env.config";
import { getCookie, setCookie, deleteCookie } from "@/utils/cookies";

// Standard client-side Axios instance
export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically inject authorization tokens
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = getCookie("accessToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Variable and queue management to handle concurrent 401s while refreshing token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle global errors (like 401 unauthorized or token refresh)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Intercept 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getCookie("refreshToken");
      const deviceId = getCookie("deviceId");

      if (refreshToken && deviceId) {
        try {
          // Request new tokens from backend using native axios client to avoid circular interceptor triggers
          const response = await axios.post(`${env.NEXT_PUBLIC_API_URL}/auth/refresh-token`, {
            refreshToken,
            deviceId,
          });

          if (response.data?.success && response.data?.data) {
            const { accessToken: newAccessToken, refreshToken: newRefreshToken, deviceId: newDeviceId } = response.data.data;

            // Save new tokens in cookies
            setCookie("accessToken", newAccessToken, 7);
            setCookie("refreshToken", newRefreshToken, 30);
            setCookie("deviceId", newDeviceId, 365);

            // Update Authorization header for original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }

            processQueue(null, newAccessToken);
            isRefreshing = false;

            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;

          // Clear credentials and redirect to login page
          deleteCookie("accessToken");
          deleteCookie("refreshToken");
          deleteCookie("deviceId");
          deleteCookie("user");

          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, clear cookies and redirect
        deleteCookie("accessToken");
        deleteCookie("refreshToken");
        deleteCookie("deviceId");
        deleteCookie("user");

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);
