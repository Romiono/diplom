import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';

export const categoryKeys = {
  all: ['categories'] as const,
  byId: (id: number) => ['categories', id] as const,
};

export const useCategories = () =>
  useQuery({
    queryKey: categoryKeys.all,
    queryFn: () => categoriesApi.getAll(),
    staleTime: 1000 * 60 * 10, // categories rarely change
  });

export const useCategory = (id: number) =>
  useQuery({
    queryKey: categoryKeys.byId(id),
    queryFn: () => categoriesApi.getById(id),
    enabled: !!id,
  });
