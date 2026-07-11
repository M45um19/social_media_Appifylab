import axios from "axios";

// Standard client-side Axios instance
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically inject authorization tokens
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
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

// Response interceptor to handle global errors (like 401 unauthorized or token refresh)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Standard error logging or token refresh logic could be added here in the future
    return Promise.reject(error);
  }
);
