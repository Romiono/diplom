import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
  authRateLimit: {
    ttl: parseInt(process.env.AUTH_RATE_LIMIT_TTL, 10) || 900,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 5,
  },
  csrf: {
    enabled: process.env.CSRF_ENABLED === 'true',
  },
}));
