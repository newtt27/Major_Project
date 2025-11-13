// src/middleware/auth.middleware.ts
import type { Request, Response, NextFunction } from "express"
import { verifyAccessToken, type JWTPayload } from "../config/jwt"

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token =
      req.cookies?.access_token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null)

    if (!token) {
      res.status(401).json({ error: "Access token required" })
      return
    }

    const decoded = verifyAccessToken(token)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired access token" })
  }
}

export const authorize = (...requiredRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" })
      return
    }

    const hasRole = req.user.roles.some((role) => requiredRoles.includes(role))
    if (!hasRole) {
      res.status(403).json({ error: "Insufficient permissions" })
      return
    }

    next()
  }
}