// src/routes/rbac.routes.ts
import { Router } from "express"
import { RBACController } from "../controllers/rbac.controller"
import { authenticate, authorize } from "../middleware/auth.middleware"
import { hasPermission } from "../middleware/permission.middleware"
import { body, param } from "express-validator"
import { validate } from "../middleware/validation.middleware"

const router = Router()
const rbacController = new RBACController()

// === CHỈ ADMIN ĐƯỢC DÙNG TẤT CẢ ===
const adminOnly = [authenticate, authorize("admin")]

// ---------------------------------------------------------------------
// PERMISSIONS
// ---------------------------------------------------------------------
router.post(
  "/permissions",
  [
    ...adminOnly,
    hasPermission("rbac:permission:create"),
    body("permission_name")
      .notEmpty()
      .withMessage("permission_name is required")
      .isString()
      .withMessage("permission_name must be string")
      .trim(),
    body("category").optional().isString().trim(),
    body("description").optional().isString().trim(),
    validate,
  ],
  rbacController.createPermission
)

router.get("/permissions", [...adminOnly, hasPermission("rbac:permission:list")], rbacController.getPermissions)
router.put(
  "/permissions/:permission_id",
  [
    ...adminOnly,
    hasPermission("rbac:permission:update"),
    param("permission_id").isInt({ min: 1 }).toInt(),
    body("permission_name").optional().isString().trim(),
    body("category").optional().isString().trim(),
    body("description").optional().isString().trim(),
    body("status").optional().isIn(["Active", "Inactive"]),
    validate,
  ],
  rbacController.updatePermission
)
router.delete(
  "/permissions/:permission_id",
  [
    ...adminOnly,
    hasPermission("rbac:permission:delete"),
    param("permission_id").isInt({ min: 1 }).toInt(),
    validate,
  ],
  rbacController.deletePermission
)
// ---------------------------------------------------------------------
// ROLES
// ---------------------------------------------------------------------
router.put(
  "/roles/:role_id",
  [
    ...adminOnly,
    hasPermission("rbac:role:update"), // ← Quyền mới
    param("role_id")
      .isInt({ min: 1 })
      .withMessage("role_id must be positive integer")
      .toInt(),
    body("role_name")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("role_name must be 2-50 characters")
      .matches(/^[a-zA-Z0-9\s\-_]+$/)
      .withMessage("role_name only allows letters, numbers, space, -, _")
      .trim(),
    body("description").optional().isString().trim(),
    body("status").optional().isIn(["Active", "Inactive"]),
    validate,
  ],
  rbacController.updateRole // ← Controller method mới
)
router.post(
  "/roles",
  [
    ...adminOnly,
    hasPermission("rbac:role:create"),
    body("role_name")
  .isLength({ min: 2, max: 50 })
  .withMessage("role_name must be 2-50 characters")
  .matches(/^[a-zA-Z0-9\s\-_]+$/)
  .withMessage("role_name only allows letters, numbers, space, -, _")
  .trim(),
    validate,
  ],
  rbacController.createRole
)

router.get("/roles", [...adminOnly, hasPermission("rbac:role:list")], rbacController.getRoles)
router.delete(
  "/roles/:role_id",
  [
    ...adminOnly,
    hasPermission("rbac:role:delete"),
    param("role_id").isInt({ min: 1 }).toInt(),
    validate,
  ],
  rbacController.deleteRole
)
// ---------------------------------------------------------------------
// ROLE - PERMISSION ASSIGNMENT
// ---------------------------------------------------------------------
router.post(
  "/roles/permissions",
  [
    ...adminOnly,
    hasPermission("rbac:role:assign-permission"),
    body("role_id")
      .isInt({ min: 1 })
      .withMessage("role_id must be positive integer")
      .toInt(),
    body("permission_id")
      .isInt({ min: 1 })
      .withMessage("permission_id must be positive integer")
      .toInt(),
    validate,
  ],
  rbacController.assignPermissionToRole
)

router.delete(
  "/roles/:role_id/permissions/:permission_id",
  [
    ...adminOnly,
    hasPermission("rbac:role:remove-permission"),
    param("role_id")
      .isInt({ min: 1 })
      .withMessage("role_id must be positive integer")
      .toInt(),
    param("permission_id")
      .isInt({ min: 1 })
      .withMessage("permission_id must be positive integer")
      .toInt(),
    validate,
  ],
  rbacController.removePermissionFromRole
)

router.get(
  "/roles/:role_id/permissions",
  [
    ...adminOnly,
    hasPermission("rbac:role:permissions:list"),
    param("role_id")
      .isInt({ min: 1 })
      .withMessage("role_id must be positive integer")
      .toInt(),
    validate,
  ],
  rbacController.getRolePermissions
)

// ---------------------------------------------------------------------
// ACCOUNT - ROLE ASSIGNMENT
// ---------------------------------------------------------------------
router.post(
  "/accounts/roles",
  [
    ...adminOnly,
    hasPermission("rbac:account:assign-role"),
    body("account_id")
      .isInt({ min: 1 })
      .withMessage("account_id must be positive integer")
      .toInt(),
    body("role_id")
      .isInt({ min: 1 })
      .withMessage("role_id must be positive integer")
      .toInt(),
    validate,
  ],
  rbacController.assignRoleToAccount
)

router.delete(
  "/accounts/:account_id/roles/:role_id",
  [
    ...adminOnly,
    hasPermission("rbac:account:remove-role"),
    param("account_id")
      .isInt({ min: 1 })
      .withMessage("account_id must be positive integer")
      .toInt(),
    param("role_id")
      .isInt({ min: 1 })
      .withMessage("role_id must be positive integer")
      .toInt(),
    validate,
  ],
  rbacController.removeRoleFromAccount
)

router.get(
  "/accounts/:account_id/roles",
  [
    ...adminOnly,
    hasPermission("rbac:account:roles:list"),
    param("account_id")
      .isInt({ min: 1 })
      .withMessage("account_id must be positive integer")
      .toInt(),
    validate,
  ],
  rbacController.getAccountRoles
)

export default router