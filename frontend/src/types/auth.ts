export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: "admin" | "manager" | "user";
  organization_name?: string;
  profile_photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdatePayload {
  first_name: string;
  last_name: string;
}

export interface PasswordChangePayload {
  current_password: string;
  new_password: string;
}
