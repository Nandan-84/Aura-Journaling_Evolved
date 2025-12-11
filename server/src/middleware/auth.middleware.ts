import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: { userId: string; name: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.token; // Read from cookie

  if (!token) {
    return res.status(401).json({ error: "Access denied. Please login." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as { userId: string; name: string };
    req.user = verified; // Attach user info to request
    next(); // Pass to the next handler
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};