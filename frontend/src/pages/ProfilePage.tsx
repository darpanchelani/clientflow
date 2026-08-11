import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
} from "@mui/material";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import AppCard from "../components/common/AppCard";
import AppForm from "../components/common/AppForm";
import AppPageHeader from "../components/common/AppPageHeader";
import FormTextField from "../components/common/FormTextField";
import LoadingButton from "../components/common/LoadingButton";
import { useMutationWithFeedback } from "../hooks/useMutationWithFeedback";
import { formResolver } from "../lib/validation/formResolver";
import {
  passwordChangeSchema,
  PasswordChangeFormData,
  profileSchema,
  ProfileFormData,
} from "../lib/validation/schemas";
import { changePassword, updateProfile } from "../services/profileApi";
import { useAppDispatch, useAppSelector } from "../store";
import { logout, setUser } from "../store/slices/authSlice";
import type { ApiErrorPayload } from "../utils/apiError";

type ProfileField = keyof ProfileFormData;
type PasswordField = keyof PasswordChangeFormData;

const getResponsePayload = (error: unknown): ApiErrorPayload | undefined =>
  (error as { response?: { data?: ApiErrorPayload } })?.response?.data;

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: formResolver(profileSchema),
    defaultValues: { first_name: "", last_name: "" },
    mode: "onBlur",
  });
  const passwordForm = useForm<PasswordChangeFormData>({
    resolver: formResolver(passwordChangeSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
      });
    }
  }, [profileForm, user]);

  const profileMutation = useMutationWithFeedback(updateProfile, {
    successMessage: "Your profile has been updated.",
    errorMessage: "Could not update your profile.",
    onSuccess: (updatedUser) => {
      dispatch(setUser(updatedUser));
      profileForm.reset({
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
      });
    },
    onError: (error) => {
      const fields = getResponsePayload(error)?.fields;
      if (!fields || typeof fields !== "object") return;
      (["first_name", "last_name"] as ProfileField[]).forEach((field) => {
        const message = fields[field];
        if (message) {
          profileForm.setError(field, {
            type: "server",
            message: Array.isArray(message) ? message[0] : message,
          });
        }
      });
    },
  });

  const passwordMutation = useMutationWithFeedback(changePassword, {
    successMessage: "Password updated. Sign in again to continue.",
    errorMessage: "Could not change your password.",
    onSuccess: () => {
      passwordForm.reset();
      void dispatch(logout()).then(() => navigate("/login", { replace: true }));
    },
    onError: (error) => {
      const fields = getResponsePayload(error)?.fields;
      if (!fields || typeof fields !== "object") return;
      (["current_password", "new_password"] as PasswordField[]).forEach(
        (field) => {
          const message = fields[field];
          if (message) {
            passwordForm.setError(field, {
              type: "server",
              message: Array.isArray(message) ? message[0] : message,
            });
          }
        }
      );
    },
  });

  const fullName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim();
  const initials =
    `${user?.first_name?.[0] ?? ""}${
      user?.last_name?.[0] ?? ""
    }`.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "C";
  const roleLabel = user?.role
    ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`
    : "Member";
  const memberSince = useMemo(() => {
    if (!user?.created_at) return "Not available";
    return new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    }).format(new Date(user.created_at));
  }, [user?.created_at]);

  const passwordAdornment = (
    visible: boolean,
    toggle: () => void,
    label: string
  ) => (
    <InputAdornment position="end">
      <IconButton edge="end" onClick={toggle} aria-label={label}>
        {visible ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Stack spacing={3}>
      <AppPageHeader
        title="My profile"
        description="Manage your personal details and keep your account secure."
      />

      <Grid container spacing={2.5} alignItems="flex-start">
        <Grid item xs={12} md={4} lg={3.5}>
          <AppCard>
            <Stack alignItems="center" spacing={1.25} sx={{ pt: 1, pb: 2.5 }}>
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontSize: 24,
                  fontWeight: 750,
                }}
              >
                {initials}
              </Avatar>
              <Box sx={{ textAlign: "center", minWidth: 0, width: "100%" }}>
                <Typography variant="h5" noWrap>
                  {fullName || "Workspace member"}
                </Typography>
                <Typography color="text.secondary" variant="body2" noWrap>
                  {user?.email}
                </Typography>
              </Box>
              <Chip
                label={roleLabel}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Stack>

            <Divider />

            <Stack spacing={2} sx={{ pt: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <MailOutlineIcon color="action" fontSize="small" />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    Sign-in email
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={650}
                    sx={{ overflowWrap: "anywhere" }}
                  >
                    {user?.email || "Not available"}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <BusinessOutlinedIcon color="action" fontSize="small" />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    Workspace
                  </Typography>
                  <Typography variant="body2" fontWeight={650}>
                    {user?.organization_name || "Personal workspace"}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <SecurityOutlinedIcon color="action" fontSize="small" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Access level
                  </Typography>
                  <Typography variant="body2" fontWeight={650}>
                    {roleLabel}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <CalendarTodayOutlinedIcon color="action" fontSize="small" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Member since
                  </Typography>
                  <Typography variant="body2" fontWeight={650}>
                    {memberSince}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </AppCard>
        </Grid>

        <Grid item xs={12} md={8} lg={8.5}>
          <Stack spacing={2.5}>
            <AppCard
              title="Personal information"
              subtitle="This is how your name appears throughout ClientFlow."
            >
              <AppForm
                form={profileForm}
                formId="profile-form"
                onSubmit={(values) => profileMutation.mutate(values)}
              >
                <Stack spacing={2.5}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <FormTextField<ProfileFormData>
                      name="first_name"
                      label="First name"
                      autoComplete="given-name"
                      fullWidth
                      required
                    />
                    <FormTextField<ProfileFormData>
                      name="last_name"
                      label="Last name"
                      autoComplete="family-name"
                      fullWidth
                      required
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <LoadingButton
                      variant="outlined"
                      disabled={
                        !profileForm.formState.isDirty ||
                        profileMutation.isLoading
                      }
                      onClick={() => profileForm.reset()}
                    >
                      Discard
                    </LoadingButton>
                    <LoadingButton
                      type="submit"
                      variant="contained"
                      loading={profileMutation.isLoading}
                      loadingLabel="Saving..."
                      disabled={!profileForm.formState.isDirty}
                    >
                      Save changes
                    </LoadingButton>
                  </Stack>
                </Stack>
              </AppForm>
            </AppCard>

            <AppCard
              title="Password and sessions"
              subtitle="Use a unique password that you do not use for another account."
            >
              <AppForm
                form={passwordForm}
                formId="password-form"
                onSubmit={({ confirm_password, ...values }) =>
                  passwordMutation.mutate(values)
                }
              >
                <Stack spacing={2}>
                  <Alert severity="info">
                    Changing your password signs you out of every ClientFlow
                    session.
                  </Alert>
                  <FormTextField<PasswordChangeFormData>
                    name="current_password"
                    label="Current password"
                    type={showCurrentPassword ? "text" : "password"}
                    autoComplete="current-password"
                    fullWidth
                    required
                    InputProps={{
                      endAdornment: passwordAdornment(
                        showCurrentPassword,
                        () => setShowCurrentPassword((visible) => !visible),
                        showCurrentPassword
                          ? "Hide current password"
                          : "Show current password"
                      ),
                    }}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <FormTextField<PasswordChangeFormData>
                      name="new_password"
                      label="New password"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      helperText="At least 8 characters with upper, lower, and number"
                      fullWidth
                      required
                      InputProps={{
                        endAdornment: passwordAdornment(
                          showNewPassword,
                          () => setShowNewPassword((visible) => !visible),
                          showNewPassword
                            ? "Hide new password"
                            : "Show new password"
                        ),
                      }}
                    />
                    <FormTextField<PasswordChangeFormData>
                      name="confirm_password"
                      label="Confirm new password"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      fullWidth
                      required
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="flex-end">
                    <LoadingButton
                      type="submit"
                      variant="contained"
                      loading={passwordMutation.isLoading}
                      loadingLabel="Updating password..."
                    >
                      Update password
                    </LoadingButton>
                  </Stack>
                </Stack>
              </AppForm>
            </AppCard>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default ProfilePage;
