// src/controllers/rbac.controller.ts
import type { Response } from "express"
import type { AuthenticatedRequest } from "../middleware/auth.middleware"
import { RBACService } from "../services/rbac.services"
import type {
  CreatePermissionDTO,
  CreateRoleDTO,
  AssignPermissionToRoleDTO,
  AssignRoleToAccountDTO,
  UpdatePermissionDTO,
  UpdateRoleDTO
} from "../dto/rbac.dto"

const rbacService = new RBACService()

export class RBACController {
  // === PERMISSIONS ===
  async createPermission(req: AuthenticatedRequest, res: Response) {
    const data: CreatePermissionDTO = req.body
    const result = await rbacService.createPermission(data)
    return res.status(201).json({ message: "Permission created", data: result })
  }
 async updatePermission(req: AuthenticatedRequest, res: Response) {
    const permission_id = parseInt(req.params.permission_id)
    const data: UpdatePermissionDTO = req.body
    const result = await rbacService.updatePermission(permission_id, data)
    return res.json({ message: "Permission updated", data: result })
  }

  async deletePermission(req: AuthenticatedRequest, res: Response) {
    const permission_id = parseInt(req.params.permission_id)
    const result = await rbacService.deletePermission(permission_id)
    return res.json(result)
  }
  async getPermissions(_req: AuthenticatedRequest, res: Response) {
    const data = await rbacService.getPermissions()
    return res.json({ data })
  }

  // === ROLES ===
  async createRole(req: AuthenticatedRequest, res: Response) {
    const data: CreateRoleDTO = req.body
    const result = await rbacService.createRole(data)
    return res.status(201).json({ message: "Role created/updated", data: result })
  }
 async updateRole(req: AuthenticatedRequest, res: Response) {
    const role_id = parseInt(req.params.role_id)
    const data: UpdateRoleDTO = req.body
    const result = await rbacService.updateRole(role_id, data)
    return res.json({ message: "Role updated", data: result })
  }

  async deleteRole(req: AuthenticatedRequest, res: Response) {
    const role_id = parseInt(req.params.role_id)
    const result = await rbacService.deleteRole(role_id)
    return res.json(result)
  }
  async getRoles(_req: AuthenticatedRequest, res: Response) {
    const data = await rbacService.getRoles()
    console.log("✅ Returning roles:", data.length, "items")
    return res.json(data)
  }

  // === ROLE - PERMISSION ===
  async assignPermissionToRole(req: AuthenticatedRequest, res: Response) {
    const data: AssignPermissionToRoleDTO = req.body
    const result = await rbacService.assignPermissionToRole(data)
    return res.json(result)
  }

  async removePermissionFromRole(req: AuthenticatedRequest, res: Response) {
    const role_id = parseInt(req.params.role_id)
    const permission_id = parseInt(req.params.permission_id)
    const result = await rbacService.removePermissionFromRole(role_id, permission_id)
    return res.json(result)
  }

 async getRolePermissions(req: AuthenticatedRequest, res: Response) {
    const role_id = parseInt(req.params.role_id)
    const data = await rbacService.getRolePermissions(role_id)
    return res.json(data)
  }

  // === ACCOUNT - ROLE ===
  async assignRoleToAccount(req: AuthenticatedRequest, res: Response) {
    const data: AssignRoleToAccountDTO = req.body
    const result = await rbacService.assignRoleToAccount(data)
    return res.json(result)
  }

  async removeRoleFromAccount(req: AuthenticatedRequest, res: Response) {
    const account_id = parseInt(req.params.account_id)
    const role_id = parseInt(req.params.role_id)
    const result = await rbacService.removeRoleFromAccount(account_id, role_id)
    return res.json(result)
  }

  async getAccountRoles(req: AuthenticatedRequest, res: Response) {
    const account_id = parseInt(req.params.account_id)
    const data = await rbacService.getAccountRoles(account_id)
    return res.json(data)
  }
}