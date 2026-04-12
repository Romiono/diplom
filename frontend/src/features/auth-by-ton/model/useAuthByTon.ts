'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react';
import { useAuthStore } from '@entities/user/model/auth.store';
import { usersApi } from '@entities/user/api/usersApi';
import { toast } from 'sonner';

function generateNonce(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for HTTP (non-secure) contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function useAuthByTon() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const address = useTonAddress();
  const { isAuthenticated, setAuth, logout } = useAuthStore();
  const [isPending, setIsPending] = useState(false);

  const connect = useCallback(async () => {
    const payload = generateNonce();
    tonConnectUI.setConnectRequestParameters({
      state: 'ready',
      value: { tonProof: payload },
    });
    await tonConnectUI.openModal();
  }, [tonConnectUI]);

  // Authenticate as soon as wallet provides a ton_proof
  useEffect(() => {
    if (isAuthenticated || !wallet || isPending) return;

    const proofItem = wallet.connectItems?.tonProof;
    if (!proofItem || !('proof' in proofItem)) return;

    const proof = proofItem.proof;

    const authenticate = async () => {
      setIsPending(true);
      try {
        const result = await usersApi.tonConnect({
          walletAddress: wallet.account.address,
          publicKey: wallet.account.publicKey ?? '',
          signature: proof.signature,
          payload: proof.payload,
          timestamp: proof.timestamp,
          domain: proof.domain.value,
          domainLen: proof.domain.lengthBytes,
        });
        setAuth(result.accessToken, result.user);
      } catch {
        toast.error('Authentication failed. Please try again.');
        tonConnectUI.disconnect();
      } finally {
        setIsPending(false);
      }
    };

    authenticate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.connectItems?.tonProof, isAuthenticated]);

  const disconnect = useCallback(async () => {
    logout();
    await tonConnectUI.disconnect();
  }, [tonConnectUI, logout]);

  return { connect, disconnect, address, isAuthenticated, isPending };
}
