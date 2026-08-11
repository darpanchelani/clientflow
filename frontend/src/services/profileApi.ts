import type {
  PasswordChangePayload,
  ProfileUpdatePayload,
  UserProfile,
} from "../types/auth";
import api from "./api";

export const updateProfile = async (
  payload: ProfileUpdatePayload
): Promise<UserProfile> => {
  const response = await api.patch("/auth/profile", payload);
  return response.data;
};

export const changePassword = async (
  payload: PasswordChangePayload
): Promise<{ detail: string }> => {
  const response = await api.post("/auth/password", payload);
  return response.data;
};
