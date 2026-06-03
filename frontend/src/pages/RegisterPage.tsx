import React, { useEffect } from 'react';
import { formResolver } from '../lib/validation/formResolver';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Link, Stack } from '@mui/material';
import { useForm } from 'react-hook-form';

import AppForm from '../components/common/AppForm';
import FormTextField from '../components/common/FormTextField';
import LoadingButton from '../components/common/LoadingButton';
import AuthLayout from '../layouts/AuthLayout';
import { registerSchema, RegisterFormData } from '../lib/validation/schemas';
import { useAppDispatch, useAppSelector } from '../store';
import { clearError, register } from '../store/slices/authSlice';
import { getFriendlyErrorMessage } from '../utils/apiError';

const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  const form = useForm<RegisterFormData>({
    resolver: formResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      organization_name: '',
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values: RegisterFormData) => {
    dispatch(clearError());
    const result = await dispatch(register(values));
    if (register.rejected.match(result)) {
      form.setError('root', {
        message: getFriendlyErrorMessage(result.payload, 'Registration failed'),
      });
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Set up your ClientFlow workspace.">
      <AppForm form={form} formId="register-form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          {error || form.formState.errors.root ? (
            <Alert severity="error" role="alert">
              {form.formState.errors.root?.message ?? error}
            </Alert>
          ) : null}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormTextField<RegisterFormData>
              name="first_name"
              label="First name"
              autoComplete="given-name"
              fullWidth
              required
            />
            <FormTextField<RegisterFormData>
              name="last_name"
              label="Last name"
              autoComplete="family-name"
              fullWidth
              required
            />
          </Stack>
          <FormTextField<RegisterFormData>
            name="organization_name"
            label="Organization"
            fullWidth
            required
          />
          <FormTextField<RegisterFormData>
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            fullWidth
            required
          />
          <FormTextField<RegisterFormData>
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            helperText="At least 8 characters with upper, lower, and number"
            fullWidth
            required
          />
          <LoadingButton
            type="submit"
            variant="contained"
            size="large"
            loading={isLoading}
            loadingLabel="Creating account..."
          >
            Create account
          </LoadingButton>
          <Link component={RouterLink} to="/login" underline="hover">
            Already have an account? Sign in
          </Link>
        </Stack>
      </AppForm>
    </AuthLayout>
  );
};

export default RegisterPage;
