import { apiFetch } from '@shared/api/client';
import type { Category } from '@shared/types/api';

export const categoriesApi = {
  getAll: () => apiFetch<Category[]>('/categories'),
  getById: (id: number) => apiFetch<Category>(`/categories/${id}`),
};
