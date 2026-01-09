import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  walletAddress: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
