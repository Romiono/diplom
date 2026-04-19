import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3000';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
let productionHostname: string | null = null;
try {
  if (appUrl.startsWith('https://')) {
    productionHostname = new URL(appUrl).hostname;
  }
} catch {
  productionHostname = null;
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.0.158.126', '10.133.132.229', '192.168.0.101'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '10.0.158.126',
        port: '3000',
        pathname: '/api/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '10.133.132.229',
        port: '3000',
        pathname: '/api/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.0.101',
        port: '3000',
        pathname: '/api/uploads/**',
      },
      ...(productionHostname
        ? [
            {
              protocol: 'https' as const,
              hostname: productionHostname,
              pathname: '/api/uploads/**',
            },
          ]
        : []),
    ],
  },
};

export default withNextIntl(nextConfig);
