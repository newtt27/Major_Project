// src/routes/task.routes.ts
import { Router } from "express"
import { TaskController } from "../controllers/task.controller"
import { authenticate, authorize } from "../middleware/auth.middleware"
import { hasPermission } from "../middleware/permission.middleware"
import { body } from "express-validator"
import { validate } from "../middleware/validation.middleware"
import { upload } from "../middleware/upload.middleware"  // ĐÃ DÙNG Ở ĐÂY

const router = Router()
const ctrl = new TaskController()

router.use(authenticate)

// Manager + Admin
router.post("/", authorize("manager", "admin"), hasPermission("task:create"), [
  body("title").notEmpty(),
  body("assigned_users").isArray({ min: 1 }),
  validate
], ctrl.createTask)

// User
router.get("/my", hasPermission("task:my:list"), ctrl.getMyTasks)
router.get("/:id", hasPermission("task:read"), ctrl.getTaskById)

// Progress
router.post("/:id/progress", hasPermission("task:update-progress"), ctrl.updateTaskProgress)

// ĐÃ SỬA: DÙNG upload middleware
router.post(
  "/:id/attachments",
  hasPermission("task:upload-attachment"),
  upload.array("files", 10),  // Cho phép tối đa 10 file
  ctrl.uploadAttachments
)

// Manager + Admin
router.put("/:id", authorize("manager", "admin"), hasPermission("task:update"), ctrl.updateTask)
router.delete("/:id", authorize("manager", "admin"), hasPermission("task:delete"), ctrl.deleteTask)
router.put("/:id/main-assignee", authorize("manager", "admin"), hasPermission("task:change-assignee"), ctrl.changeMainAssignee)
router.put("/:id/assignments", authorize("manager", "admin"), hasPermission("task:update-assignments"), ctrl.updateTaskAssignments)

router.get("/:id/history", hasPermission("task:history:read"), ctrl.getTaskHistory)

//Thêm
router.get("/part/:partId", hasPermission("task:read"), ctrl.getTasksByPartId)
// Thêm sau các route khác
router.get(
  "/full/:id", 
  hasPermission("task:read"),  // Ai có quyền xem task đều được
  ctrl.getTaskFullDetail
);

export default router