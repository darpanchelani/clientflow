import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { Controller, FieldValues, Path, useFormContext } from 'react-hook-form';

type FormTextFieldProps<T extends FieldValues> = Omit<TextFieldProps, 'name'> & {
  name: Path<T>;
  required?: boolean;
};

const FormTextField = <T extends FieldValues>({
  name,
  required,
  helperText,
  ...props
}: FormTextFieldProps<T>) => {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          value={field.value ?? ''}
          required={required}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
          inputProps={{
            ...props.inputProps,
            'aria-invalid': fieldState.error ? 'true' : 'false',
          }}
          InputLabelProps={{
            ...props.InputLabelProps,
            required: required ? true : undefined,
          }}
        />
      )}
    />
  );
};

export default FormTextField;
