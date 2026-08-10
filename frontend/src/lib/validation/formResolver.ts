import { zodResolver } from '@hookform/resolvers/zod';
import { FieldValues, Resolver } from 'react-hook-form';

// Keep the resolver cast centralized so form components retain exact field types.
export const formResolver = <T extends FieldValues>(schema: unknown): Resolver<T> =>
  zodResolver(schema as Parameters<typeof zodResolver>[0]) as Resolver<T>;
