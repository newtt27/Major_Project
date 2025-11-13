// src/middleware/error.middleware.ts
import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  data?: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Hàm error handler chính
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      status: err.statusCode,
      ...(err.data ? { details: err.data } : {}),
    });
  }

  console.error("Unexpected error:", err);

  return res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development"
      ? { message: err.message, stack: err.stack }
      : {}),
  });
};