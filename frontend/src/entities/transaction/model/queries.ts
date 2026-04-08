import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '../api/transactionsApi';

export const txKeys = {
  all: ['transactions'] as const,
  list: (page: number) => ['transactions', 'list', page] as const,
  detail: (id: string) => ['transactions', id] as const,
};

export const useTransactions = (page = 1) =>
  useQuery({
    queryKey: txKeys.list(page),
    queryFn: () => transactionsApi.getAll(page),
  });

export const useTransaction = (id: string) =>
  useQuery({
    queryKey: txKeys.detail(id),
    queryFn: () => transactionsApi.getById(id),
    enabled: !!id,
  });
