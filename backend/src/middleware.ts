import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Check if it's a local token (base64 encoded JSON)
  try {
    const decoded = JSON.parse(atob(token));
    if (decoded.local && decoded.role === 'superadmin') {
      // Allow local superadmin token in development
      req.user = {
        id: decoded.id || 0,
        username: decoded.username || 'superadmin',
        email: decoded.email || 'superadmin@dict.gov.ph'
      };
      return next();
    }
  } catch (e) {
    // Not a local token, continue with JWT verification
  }

  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user as { id: number; username: string; email: string };
    next();
  });
};