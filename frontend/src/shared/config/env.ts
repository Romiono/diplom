const defaultWsUrl =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3000';

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || defaultWsUrl,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001',
  tonNetwork: process.env.NEXT_PUBLIC_TON_NETWORK ?? 'testnet',
} as const;
