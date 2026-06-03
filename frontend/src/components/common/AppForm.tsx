import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { FieldValues, FormProvider, SubmitHandler, UseFormReturn } from 'react-hook-form';

interface AppFormProps<T extends FieldValues> extends Omit<BoxProps, 'onSubmit'> {
  form: UseFormReturn<T>;
  formId: string;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
}

const AppForm = <T extends FieldValues>({
  form,
  formId,
  onSubmit,
  children,
  ...boxProps
}: AppFormProps<T>) => (
  <FormProvider {...form}>
    <Box
      component="form"
      id={formId}
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      {...boxProps}
    >
      {children}
    </Box>
  </FormProvider>
);

export default AppForm;
