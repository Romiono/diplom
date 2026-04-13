import { apiFetch } from '@shared/api/client';
import type { BlockchainHealth } from '@shared/types/api';

export interface BalanceResponse {
  address: string;
  balance: string;
  balanceTON: string;
}

export interface EscrowState {
  address: string;
  seller: string;
  buyer: string;
  
  amount: number;
  status: string; 
  timeout: string;
  admin: string;
  isDeployed: boolean;
  [key: string]: unknown;
}

export const blockchainApi = {
  health: () => apiFetch<BlockchainHealth>('/blockchain/health'),

  getBalance: (address: string) =>
    apiFetch<BalanceResponse>(`/blockchain/balance/${address}`),

  getEscrowState: (address: string) =>
    apiFetch<EscrowState>(`/blockchain/escrow/${address}`),

  isContractDeployed: (address: string) =>
    apiFetch<{ address: string; isDeployed: boolean }>(
      `/blockchain/contract/${address}/deployed`,
    ),
};
