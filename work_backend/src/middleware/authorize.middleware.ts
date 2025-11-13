import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    role: "admin" | "manager" | "user";
  };
}

type Role = "admin" | "manager" | "user";

export function authorize(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }

    // Nếu mọi thứ OK, tiếp tục middleware chain
    return next();
  };
}