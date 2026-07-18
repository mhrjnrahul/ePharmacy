import { api } from "./axios";
import type { LoginRequest, LoginResponse, RegisterRequest} from "@/types";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  user_id: string;
  exp: number;
}

export const decodeUser = (token: string): { user_id: string; exp: number } => {
  return jwtDecode<JwtPayload>(token);
};


export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/api/auth/login/", data);
  return response.data;
};

export const registerUser = async (data: RegisterRequest): Promise<void> => {
  await api.post("/api/auth/register/", data);
};

export const refreshToken = async (
  refresh: string,
): Promise<{ access: string }> => {
  const response = await api.post<{ access: string }>("/api/auth/refresh/", {
    refresh,
  });
  return response.data;
};

export const logoutUser = async (refresh: string): Promise<void> => {
  await api.post("/api/auth/logout/", { refresh });
};
