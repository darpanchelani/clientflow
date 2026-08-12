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

export const uploadProfilePhoto = async (file: File): Promise<UserProfile> => {
  const formData = new FormData();
  formData.append("profile_photo", file);
  const response = await api.patch("/auth/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const removeProfilePhoto = async (): Promise<UserProfile> => {
  const response = await api.delete("/auth/profile/photo");
  return response.data;
};
