// // src/routes/auth.routes.ts
// import { Router } from "express"
// import { AuthController } from "../controllers/auth.controller"
// import { authenticate, authorize } from "../middleware/auth.middleware"
// import { hasPermission } from "../middleware/permission.middleware"
// import { body, param } from "express-validator"
// import { validate } from "../middleware/validation.middleware"
//
// const router = Router()
// const authController = new AuthController()
//
// // =============================
// // PUBLIC ROUTES
// // =============================
// router.post(
//   "/login",
//   [
//     body("email").isEmail().withMessage("Valid email required"),
//     body("password").notEmpty().withMessage("Password required"),
//     validate,
//   ],
//   authController.login
// )
//
// router.post(
//   "/forgot-password",
//   [
//     body("email").isEmail().withMessage("Valid email required"),
//     validate,
//   ],
//   authController.forgotPassword
// )
//
// router.post("/refresh-token", authController.refreshToken)
//
// // =============================
// // PROTECTED ROUTES (ALL USERS)
// // =============================
// router.post(
//   "/change-password",
//   authenticate,
//   hasPermission("auth:change-password"),
//   [
//     body("old_password").notEmpty().withMessage("Old password required"),
//     body("new_password").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
//     validate,
//   ],
//   authController.changePassword
// )
//
// router.post("/logout", authenticate, hasPermission("auth:logout"), authController.logout)
// router.get("/profile", authenticate, hasPermission("user:profile:read"), authController.getProfile)
//
// // =============================
// // ADMIN ONLY: REGISTER + CRUD USER + CRUD ACCOUNT
// // =============================
// const adminOnly = [authenticate, authorize("admin")]
//
// // --- REGISTER (vẫn giữ để tạo nhanh User + Account + role) ---
// router.post(
//   "/register",
//   [
//     ...adminOnly,
//     hasPermission("user:register"),
//     body("first_name").notEmpty().withMessage("First name required"),
//     body("last_name").notEmpty().withMessage("Last name required"),
//     body("email").isEmail().withMessage("Valid email required"),
//     body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
//     body("phone").optional().isString(),
//     body("position").optional().isString(),
//     body("department_id").optional().isInt({ min: 1 }),
//     validate,
//   ],
//   authController.register
// )
//
// // --- CRUD USER ---
// router.get("/users", [...adminOnly, hasPermission("user:list")], authController.getUsers)
//
// router.post(
//   "/users",
//   [
//     ...adminOnly,
//     hasPermission("user:create"),
//     body("first_name").notEmpty().withMessage("First name required"),
//     body("last_name").notEmpty().withMessage("Last name required"),
//     body("phone").optional().isString(),
//     body("position").optional().isString(),
//     body("department_id").optional().isInt({ min: 1 }),
//     validate,
//   ],
//   authController.createUser
// )
//
// router.get(
//   "/users/:id",
//   [
//     ...adminOnly,
//     hasPermission("user:read"),
//     param("id").isInt({ min: 1 }).withMessage("Valid user ID required"),
//     validate,
//   ],
//   authController.getUserById
// )
//
// router.put(
//   "/users/:id",
//   [
//     ...adminOnly,
//     hasPermission("user:update"),
//     param("id").isInt({ min: 1 }).withMessage("Valid user ID required"),
//     body("first_name").optional().notEmpty(),
//     body("last_name").optional().notEmpty(),
//     body("phone").optional().isString(),
//     body("position").optional().isString(),
//     body("department_id").optional().isInt({ min: 1 }),
//     body("status").optional().isIn(["Active", "Inactive"]),
//     validate,
//   ],
//   authController.updateUser
// )
//
// router.delete(
//   "/users/:id",
//   [
//     ...adminOnly,
//     hasPermission("user:delete"),
//     param("id").isInt({ min: 1 }).withMessage("Valid user ID required"),
//     validate,
//   ],
//   authController.deleteUser
// )
//
// // --- CRUD ACCOUNT ---
// router.post(
//   "/accounts",
//   [
//     ...adminOnly,
//     hasPermission("account:create"),
//     body("email").isEmail().withMessage("Valid email required"),
//     body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
//     body("user_id").optional().isInt({ min: 1 }).withMessage("user_id must be positive integer"),
//     validate,
//   ],
//   authController.createAccount
// )
//
// router.get("/accounts", [...adminOnly, hasPermission("account:list")], authController.getAccounts)
//
// router.get(
//   "/accounts/:id",
//   [
//     ...adminOnly,
//     hasPermission("account:read"),
//     param("id").isInt({ min: 1 }).withMessage("Valid account ID required"),
//     validate,
//   ],
//   authController.getAccountById
// )
//
// router.put(
//   "/accounts/:id",
//   [
//     ...adminOnly,
//     hasPermission("account:update"),
//     param("id").isInt({ min: 1 }).withMessage("Valid account ID required"),
//     body("email").optional().isEmail(),
//     body("password").optional().isLength({ min: 6 }),
//     body("status").optional().isIn(["Active", "Inactive"]),
//     body("user_id").optional().isInt({ min: 1 }).withMessage("user_id must be positive integer or null"),
//     validate,
//   ],
//   authController.updateAccount
// )
//
// router.delete(
//   "/accounts/:id",
//   [
//     ...adminOnly,
//     hasPermission("account:delete"),
//     param("id").isInt({ min: 1 }).withMessage("Valid account ID required"),
//     validate,
//   ],
//   authController.deleteAccount
// )
//
// export default router
//


// src/routes/auth.routes.ts
import express from "express"
import { AuthController } from "../controllers/auth.controller"
import { authenticate, authorize } from "../middleware/auth.middleware"

const router = express.Router()
const authController = new AuthController()

// Public routes
router.post("/login", (req, res) => authController.login(req, res))
router.post("/register", (req, res) => authController.register(req, res))
router.post("/forgot-password", (req, res) => authController.forgotPassword(req, res))
router.post("/refresh-token", (req, res) => authController.refreshToken(req, res))

// Protected routes
router.post("/change-password", authenticate, (req, res) => authController.changePassword(req, res))
router.get("/profile", authenticate, (req, res) => authController.getProfile(req, res))
router.post("/logout", authenticate, (req, res) => authController.logout(req, res))

// User CRUD (admin only)
router.post("/users", authenticate, authorize("admin"), (req, res) => authController.createUser(req, res))
router.get("/users", authenticate, authorize("admin"), (req, res) => authController.getUsers(req, res))
router.get("/users/:id", authenticate, authorize("admin"), (req, res) => authController.getUserById(req, res))
router.put("/users/:id", authenticate, authorize("admin"), (req, res) => authController.updateUser(req, res))
router.delete("/users/:id", authenticate, authorize("admin"), (req, res) => authController.deleteUser(req, res))

// Account CRUD (admin only)
router.post("/accounts", authenticate, authorize("admin"), (req, res) => authController.createAccount(req, res))
router.get("/accounts", authenticate, authorize("admin"), (req, res) => authController.getAccounts(req, res))
router.get("/accounts/:id", authenticate, authorize("admin"), (req, res) => authController.getAccountById(req, res))
router.put("/accounts/:id", authenticate, authorize("admin"), (req, res) => authController.updateAccount(req, res))
router.delete("/accounts/:id", authenticate, authorize("admin"), (req, res) => authController.deleteAccount(req, res))


//Thêm
router.get(
  "/users/by-ids",
  authenticate,
  authorize("admin"),
  (req, res) => authController.getUsersByIds(req, res)
)
router.get(
  "/department/:department_id/users",
  authenticate,
  (req, res) => authController.getUsersByDepartment(req, res)
)
export default router
