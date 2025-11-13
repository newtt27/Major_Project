// src/middleware/permission.middleware.ts
import { Response, NextFunction } from "express";
import { pool } from "../config/database";
import { AppError } from "./error.middleware";
import { AuthenticatedRequest } from "./auth.middleware";

export const hasPermission = (requiredPermission: string) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !user.userId) {
      return next(new AppError("Unauthorized: Access token is missing or invalid", 401));
    }

    if (user.roles.includes("admin")) {
      return next();
    }

    let client;
    try {
      client = await pool.connect();
      const query = `
        SELECT 1
        FROM Users u
        JOIN Accounts a ON u.user_id = a.user_id
        JOIN Account_Roles ar ON a.account_id = ar.account_id
        JOIN Roles r ON ar.role_id = r.role_id
        JOIN Role_Permissions rp ON r.role_id = rp.role_id
        JOIN Permissions p ON rp.permission_id = p.permission_id
        WHERE u.user_id = $1
          AND p.permission_name = $2
          AND p.status = 'Active'
          AND r.status = 'Active'
        LIMIT 1
      `;
      const result = await client.query(query, [user.userId, requiredPermission]);

      if (result.rowCount === 0) {
        return next(new AppError(`Forbidden: Missing permission '${requiredPermission}'`, 403));
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      next(new AppError("Internal server error", 500));
    } finally {
      if (client) client.release();
    }
  };
};