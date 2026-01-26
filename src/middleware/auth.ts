import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/settings';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    type: 'vendor' | 'customer';
    language: string;
  };
}

export interface JWTPayload {
  id: string;
  type: 'vendor' | 'customer';
  language: string;
  iat: number;
  exp: number;
}

export class AuthService {
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpiry,
    });
  }

  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
  }

  static generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, config.auth.refreshSecret, {
      expiresIn: config.auth.refreshExpiry,
    });
  }
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required',
      code: 'MISSING_TOKEN',
    });
    return;
  }

  try {
    const decoded = AuthService.verifyToken(token);
    req.user = {
      id: decoded.id,
      type: decoded.type,
      language: decoded.language,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Token verification failed',
        code: 'TOKEN_VERIFICATION_FAILED',
      });
    }
  }
}

export function requireUserType(userType: 'vendor' | 'customer') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    if (req.user.type !== userType) {
      res.status(403).json({
        success: false,
        error: `Access denied. ${userType} role required`,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = AuthService.verifyToken(token);
    req.user = {
      id: decoded.id,
      type: decoded.type,
      language: decoded.language,
    };
  } catch (error) {
    // Ignore token errors for optional auth
    console.warn('Optional auth token verification failed:', error.message);
  }

  next();
}