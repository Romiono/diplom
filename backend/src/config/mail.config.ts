import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST || 'localhost',
  port: parseInt(process.env.MAIL_PORT, 10) || 1025,
  auth: {
    user: process.env.MAIL_USER || 'test@example.com',
    pass: process.env.MAIL_PASSWORD || 'password',
  },
  from: process.env.MAIL_FROM || 'Marketplace <noreply@marketplace.com>',
}));
