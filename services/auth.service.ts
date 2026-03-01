// services/auth.service.ts
import api from "./api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "client" | "couturier";
}

export const login = async (payload: LoginPayload) => {
  const { data } = await api.post("/auth/login", payload);
  saveTokens(data.accessToken, data.refreshToken);
  return data.user;
};

export const logout = () => {
  clearTokens();
  window.location.href = "/auth/login";
};

export const getProfile = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};

// Gestion des tokens
export const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};

export const getRefreshToken = () => localStorage.getItem("refreshToken") || "";

export const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};