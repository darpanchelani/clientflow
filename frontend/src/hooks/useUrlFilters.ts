import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useUrlFilters = <T extends Record<string, string>>(
  defaults: T
): [T, (updates: Partial<T>) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const next = { ...defaults };
    (Object.keys(defaults) as Array<keyof T>).forEach((key) => {
      const value = searchParams.get(String(key));
      if (value !== null) {
        next[key] = value as T[keyof T];
      }
    });
    return next;
  }, [defaults, searchParams]);

  const setFilters = useCallback(
    (updates: Partial<T>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return [filters, setFilters];
};
