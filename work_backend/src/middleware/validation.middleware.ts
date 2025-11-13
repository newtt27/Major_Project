// src/middleware/validation.middleware.ts
import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { validateSync, ValidationError } from "class-validator";
import { plainToClass } from "class-transformer";
import { AppError } from "./error.middleware";

export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// Dùng cho class-validator DTO
export const validateDto = (dtoClass?: new () => any) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!dtoClass) return next();

    const dto = plainToClass(dtoClass, req.body);
    const errors: ValidationError[] = validateSync(dto);

    if (errors.length > 0) {
      const formatted = errors.map(err => ({
        field: err.property,
        message: Object.values(err.constraints || {}).join(", "),
      }));
      return next(new AppError("Validation failed", 400, formatted));
    }

    req.body = dto; // Gán lại DTO đã validate
    next();
  };
};