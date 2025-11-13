// src/routes/project.routes.ts
import { Router } from "express"
import { ProjectController } from "../controllers/project.controller"
import { authenticate, authorize } from "../middleware/auth.middleware"
import { hasPermission } from "../middleware/permission.middleware"
import { body } from "express-validator"
import { validate } from "../middleware/validation.middleware"

const router = Router()
const ctrl = new ProjectController()

router.use(authenticate)

// Admin only
router.post("/", authorize("admin"), hasPermission("project:create"), [
  body("project_name").notEmpty(),
  validate
], ctrl.createProject)

router.post("/parts", authorize("admin"), hasPermission("project:part:create"), [
  body("project_id").isInt(),
  body("part_name").notEmpty(),
  validate
], ctrl.createProjectPart)

// Public (authenticated)
router.get("/", hasPermission("project:list"), ctrl.getProjects)
router.get("/:id", hasPermission("project:read"), ctrl.getProjectById)
router.get("/:projectId/parts", hasPermission("project:parts:list"), ctrl.getProjectParts)
router.get("/parts/my", hasPermission("project:parts:my:list"), ctrl.getMyProjectParts)

// Admin only
router.put("/:id", authorize("admin"), hasPermission("project:update"), ctrl.updateProject)
router.delete("/:id", authorize("admin"), hasPermission("project:delete"), ctrl.deleteProject)
router.put("/parts/:id", authorize("admin"), hasPermission("project:part:update"), ctrl.updateProjectPart)
router.delete("/parts/:id", authorize("admin"), hasPermission("project:part:delete"), ctrl.deleteProjectPart)

export default router