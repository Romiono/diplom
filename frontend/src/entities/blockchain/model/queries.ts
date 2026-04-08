import { useQuery } from '@tanstack/react-query';
import { blockchainApi } from '../api/blockchainApi';

export const blockchainKeys = {
  health: ['blockchain', 'health'] as const,
  balance: (address: string) => ['blockchain', 'balance', address] as const,
  escrow: (address: string) => ['blockchain', 'escrow', address] as const,
};

export const useBlockchainHealth = () =>
  useQuery({
    queryKey: blockchainKeys.health,
    queryFn: () => blockchainApi.health(),
    staleTime: 1000 * 30,
  });

export const useTonBalance = (address: string) =>
  useQuery({
    queryKey: blockchainKeys.balance(address),
    queryFn: () => blockchainApi.getBalance(address),
    enabled: !!address,
    staleTime: 1000 * 15,
  });

export const useEscrowState = (address: string | null) =>
  useQuery({
    queryKey: blockchainKeys.escrow(address ?? ''),
    queryFn: () => blockchainApi.getEscrowState(address!),
    enabled: !!address,
    staleTime: 1000 * 15,
  });
