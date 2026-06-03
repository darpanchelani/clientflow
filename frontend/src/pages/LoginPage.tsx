import React, { useEffect } from 'react';
import { formResolver } from '../lib/validation/formResolver';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Link, Stack } from '@mui/material';
import { useForm } from 'react-hook-form';

import AppForm from '../components/common/AppForm';
import FormTextField from '../components/common/FormTextField';
import LoadingButton from '../components/common/LoadingButton';
import AuthLayout from '../layouts/AuthLayout';
import { loginSchema, LoginFormData } from '../lib/validation/schemas';
import { useAppDispatch, useAppSelector } from '../store';
import { clearError, login } from '../store/slices/authSlice';
import { getFriendlyErrorMessage } from '../utils/apiError';

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  const form = useForm<LoginFormData>({
    resolver: formResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values: LoginFormData) => {
    dispatch(clearError());
    const result = await dispatch(login(values));
    if (login.rejected.match(result)) {
      form.setError('root', {
        message: getFriendlyErrorMessage(result.payload, 'Login failed'),
      });
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to ClientFlow.">
      <AppForm form={form} formId="login-form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          {error || form.formState.errors.root ? (
            <Alert severity="error" role="alert">
              {form.formState.errors.root?.message ?? error}
            </Alert>
          ) : null}
          <FormTextField<LoginFormData>
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            fullWidth
            required
          />
          <FormTextField<LoginFormData>
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            fullWidth
            required
          />
          <LoadingButton
            type="submit"
            variant="contained"
            size="large"
            loading={isLoading}
            loadingLabel="Signing in..."
          >
            Sign in
          </LoadingButton>
          <Link component={RouterLink} to="/register" underline="hover">
            New here? Create an account
          </Link>
        </Stack>
      </AppForm>
    </AuthLayout>
  );
};

export default LoginPage;
