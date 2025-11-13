// src/services/rbac.service.ts
import { query } from "../config/database"
import { AppError } from "../middleware/error.middleware"
import type {
  CreatePermissionDTO,
  CreateRoleDTO,
  AssignPermissionToRoleDTO,
  AssignRoleToAccountDTO,
  UpdatePermissionDTO,
  UpdateRoleDTO 
} from "../dto/rbac.dto"

export class RBACService {
  // === PERMISSIONS ===
  async createPermission(data: CreatePermissionDTO) {
  const { permission_name, category, description } = data;

  const result = await query(
    `INSERT INTO Permissions (permission_name, category, description)
     VALUES ($1, $2, $3)
     ON CONFLICT (permission_name) DO UPDATE 
     SET category = EXCLUDED.category, 
         description = EXCLUDED.description
     RETURNING permission_id, permission_name, category, description, status, created_at`,
    [permission_name, category || null, description || null]
  );

  if (result.rowCount === 0) {
    throw new AppError("Permission already exists", 409); // Custom error cho duplicate
  }

  return result.rows[0];
}

async updatePermission(permission_id: number, data: UpdatePermissionDTO) {
  const { permission_name, category, description, status } = data

  const result = await query(
    `UPDATE Permissions
     SET permission_name = COALESCE($1, permission_name),
         category = COALESCE($2, category),
         description = COALESCE($3, description),
         status = COALESCE($4, status)
     WHERE permission_id = $5
     RETURNING permission_id, permission_name, category, description, status, created_at`,
    [permission_name, category, description, status, permission_id]
  )

  if (result.rowCount === 0) {
    throw new AppError("Permission not found", 404)
  }

  return result.rows[0]
}

async deletePermission(permission_id: number) {
  const result = await query(
    `DELETE FROM Permissions
     WHERE permission_id = $1
     RETURNING permission_id`,
    [permission_id]
  )

  if (result.rowCount === 0) {
    throw new AppError("Permission not found", 404)
  }

  return { message: "Permission deleted" }
 }
  async getPermissions() {
    const result = await query(
      `SELECT permission_id, permission_name, category, description, status, created_at
       FROM Permissions
       ORDER BY permission_name`
    )
    return result.rows
  }

  // === ROLES ===
  async createRole(data: CreateRoleDTO) {
    const { role_name, description } = data

    const result = await query(
      `INSERT INTO Roles (role_name, description)
       VALUES ($1, $2)
       ON CONFLICT (role_name) DO UPDATE SET description = EXCLUDED.description
       RETURNING role_id, role_name, description, status, created_at`,
      [role_name, description || null]
    )

    return result.rows[0]
  }
  // === UPDATE ROLE ===
  async updateRole(role_id: number, data: Partial<UpdateRoleDTO>) {
  const { role_name, description, status } = data;

  // Kiểm tra role tồn tại
  const roleCheck = await query("SELECT 1 FROM Roles WHERE role_id = $1", [role_id]);
  if (roleCheck.rowCount === 0) {
    throw new AppError("Role not found", 404);
  }

  const result = await query(
    `UPDATE Roles
     SET 
       role_name = COALESCE($1, role_name),
       description = COALESCE($2, description),
       status = COALESCE($3, status),
       updated_at = CURRENT_TIMESTAMP
     WHERE role_id = $4
     RETURNING role_id, role_name, description, status, created_at, updated_at`,
    [role_name ?? null, description ?? null, status ?? null, role_id]
  );

  return result.rows[0];
}
async deleteRole(role_id: number) {
  const result = await query(
    `DELETE FROM Roles
     WHERE role_id = $1
     RETURNING role_id`,
    [role_id]
  );

  if (result.rowCount === 0) {
    throw new AppError("Role not found", 404);
  }

  return { message: "Role deleted" };
}
  async getRoles() {
    const result = await query(
      `SELECT role_id, role_name, description, status, created_at
       FROM Roles
       ORDER BY role_name`
    )
    return result.rows
  }

  // === ROLE - PERMISSION ===
  async assignPermissionToRole(data: AssignPermissionToRoleDTO) {
    const { role_id, permission_id } = data

    // Kiểm tra role tồn tại
    const roleCheck = await query("SELECT 1 FROM Roles WHERE role_id = $1", [role_id])
    if (roleCheck.rowCount === 0) throw new AppError("Role not found", 404)

    // Kiểm tra permission tồn tại
    const permCheck = await query("SELECT 1 FROM Permissions WHERE permission_id = $1", [permission_id])
    if (permCheck.rowCount === 0) throw new AppError("Permission not found", 404)

    await query(
      `INSERT INTO Role_Permissions (role_id, permission_id)
       VALUES ($1, $2)
       ON CONFLICT (role_id, permission_id) DO NOTHING`,
      [role_id, permission_id]
    )

    return { message: "Permission assigned to role" }
  }

  async removePermissionFromRole(role_id: number, permission_id: number) {
    const result = await query(
      `DELETE FROM Role_Permissions
       WHERE role_id = $1 AND permission_id = $2
       RETURNING *`,
      [role_id, permission_id]
    )

    if (result.rowCount === 0) {
      throw new AppError("Assignment not found", 404)
    }

    return { message: "Permission removed from role" }
  }

  async getRolePermissions(role_id: number) {
    const result = await query(
      `SELECT p.permission_id, p.permission_name, p.category, p.description
       FROM Role_Permissions rp
       JOIN Permissions p ON rp.permission_id = p.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.permission_name`,
      [role_id]
    )

    return result.rows
  }

  // === ACCOUNT - ROLE ===
  async assignRoleToAccount(data: AssignRoleToAccountDTO) {
    const { account_id, role_id } = data

    // Kiểm tra account tồn tại
    const accCheck = await query("SELECT 1 FROM Accounts WHERE account_id = $1", [account_id])
    if (accCheck.rowCount === 0) throw new AppError("Account not found", 404)

    // Kiểm tra role tồn tại
    const roleCheck = await query("SELECT 1 FROM Roles WHERE role_id = $1", [role_id])
    if (roleCheck.rowCount === 0) throw new AppError("Role not found", 404)

    await query(
      `INSERT INTO Account_Roles (account_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (account_id, role_id) DO NOTHING`,
      [account_id, role_id]
    )

    return { message: "Role assigned to account" }
  }

  async removeRoleFromAccount(account_id: number, role_id: number) {
    const result = await query(
      `DELETE FROM Account_Roles
       WHERE account_id = $1 AND role_id = $2
       RETURNING *`,
      [account_id, role_id]
    )

    if (result.rowCount === 0) {
      throw new AppError("Assignment not found", 404)
    }

    return { message: "Role removed from account" }
  }

  async getAccountRoles(account_id: number) {
    const result = await query(
      `SELECT r.role_id, r.role_name, r.description
       FROM Account_Roles ar
       JOIN Roles r ON ar.role_id = r.role_id
       WHERE ar.account_id = $1
       ORDER BY r.role_name`,
      [account_id]
    )

    return result.rows
  }
}