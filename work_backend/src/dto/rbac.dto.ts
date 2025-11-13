// src/dto/rbac.dto.ts
export interface CreatePermissionDTO {
  permission_name: string
  category?: string
  description?: string
}
export interface CreateRoleDTO {
  role_name: string;  
  description?: string;
}
export interface UpdateRoleDTO {
  role_name?: string;
  description?: string;
  status?: "Active" | "Inactive";
}
export interface AssignPermissionToRoleDTO {
  role_id: number
  permission_id: number
}
export interface UpdatePermissionDTO {
  permission_name?: string
  category?: string
  description?: string
  status?: "Active" | "Inactive"
}
export interface AssignRoleToAccountDTO {
  account_id: number
  role_id: number
}