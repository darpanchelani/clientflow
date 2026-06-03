import { zodResolver } from '@hookform/resolvers/zod';
import { FieldValues, Resolver } from 'react-hook-form';

// Zod v4 schemas need a cast for @hookform/resolvers until types align.
export const formResolver = <T extends FieldValues>(schema: unknown): Resolver<T> =>
  zodResolver(schema as Parameters<typeof zodResolver>[0]) as Resolver<T>;
