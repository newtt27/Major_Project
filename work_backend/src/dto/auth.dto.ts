// src/dto/auth.dto.ts
export interface RegisterDTO {
  first_name: string
  last_name: string
  email: string
  password: string
  phone?: string
  position?: string
  department_id?: number
  role_ids: number[] // Vẫn giữ để register cũ
}

// DTO cho CRUD User
export interface CreateUserDTO {
  first_name: string
  last_name: string
  phone?: string
  position?: string
  department_id?: number
  created_by?: number | null
}

export interface UpdateUserDTO {
  first_name?: string
  last_name?: string
  phone?: string
  position?: string
  department_id?: number
  status?: 'Active' | 'Inactive'
}

// DTO cho CRUD Account
export interface CreateAccountDTO {
  email: string
  password: string
  user_id?: number | null // Nullable
  role_id: number; 
  status?: 'Active' | 'Inactive'
}

export interface UpdateAccountDTO {
  email?: string
  password?: string
  status?: 'Active' | 'Inactive'
  role_id?: number;
  user_id?: number | null // Để gán User sau
}

export interface LoginDTO { email: string; password: string }
export interface ChangePasswordDTO { old_password: string; new_password: string }
export interface ForgotPasswordDTO { email: string }
export interface RefreshTokenDTO { refresh_token?: string }