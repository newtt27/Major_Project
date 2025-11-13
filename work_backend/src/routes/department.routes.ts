// src/routes/department.routes.ts
import { Router } from "express";
import { departmentController } from "../controllers/department.controller";
import { authenticate } from "../middleware/auth.middleware";
import { hasPermission } from "../middleware/permission.middleware";
import { validateDto } from "../middleware/validation.middleware";
import { CreateDepartmentDto, UpdateDepartmentDto } from "../dto/department.dto";
import { param } from "express-validator";

const router = Router();

router.use(authenticate);

const adminOnly = [hasPermission("department:admin")];

// GET /api/departments
router.get("/", hasPermission("department:list"), departmentController.getAll.bind(departmentController));

// GET /api/departments/:id
router.get(
  "/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("Department ID must be a positive integer"),
    validateDto(),
  ],
  hasPermission("department:read"),
  departmentController.getById.bind(departmentController)
);

// POST /api/departments
router.post(
  "/",
  adminOnly,
  validateDto(CreateDepartmentDto),
  departmentController.create.bind(departmentController)
);

// PUT /api/departments/:id
router.put(
  "/:id",
  adminOnly,
  [
    param("id").isInt({ min: 1 }).withMessage("Department ID must be a positive integer"),
    validateDto(UpdateDepartmentDto),
  ],
  departmentController.update.bind(departmentController)
);

// DELETE /api/departments/:id
router.delete(
  "/:id",
  adminOnly,
  [
    param("id").isInt({ min: 1 }).withMessage("Department ID must be a positive integer"),
    validateDto(),
  ],
  departmentController.delete.bind(departmentController)
);

// MỚI: Manager xem nhân viên phòng ban mình quản lý
router.get(
  "/my/users",
  hasPermission("department:users:list"),
  departmentController.getMyDepartmentUsers.bind(departmentController)
);

export default router;