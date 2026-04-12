import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.0.158.126', '10.133.132.229'],
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
    ],
  },
};

export default withNextIntl(nextConfig);
