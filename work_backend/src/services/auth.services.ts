// src/services/auth.services.ts
import bcrypt from "bcryptjs"
import { query,  pool} from "../config/database"
import { generateAccessToken, generateRefreshToken, type JWTPayload } from "../config/jwt"
import type { RegisterDTO, LoginDTO, CreateUserDTO, UpdateUserDTO, UpdateAccountDTO } from "../dto/auth.dto"
import { AppError } from "../middleware/error.middleware"

export class AuthService {
  // === REGISTER (giữ nguyên, nhưng role_ids vẫn dùng cho register cũ) ===
  async register(data: RegisterDTO, createdBy: number | null) {
    await query("BEGIN")
    try {
      const existing = await query("SELECT 1 FROM Accounts WHERE email = $1", [data.email])
      if (existing.rows.length > 0) throw new AppError("Email already exists", 400)

      const hashed = await bcrypt.hash(data.password, 10)

      const userRes = await query(
        `INSERT INTO Users (first_name, last_name, phone, position, department_id, status, created_by)
         VALUES ($1, $2, $3, $4, $5, 'Active', $6) RETURNING user_id`,
        [data.first_name, data.last_name, data.phone, data.position, data.department_id, createdBy]
      )
      const userId = userRes.rows[0].user_id

      const accRes = await query(
        `INSERT INTO Accounts (user_id, email, password, status)
         VALUES ($1, $2, $3, 'Active') RETURNING account_id`,
        [userId, data.email, hashed]
      )
      const accountId = accRes.rows[0].account_id

      // Gán role (vẫn giữ cho register cũ)
      if (data.role_ids?.length) {
        for (const roleId of data.role_ids) {
          await query("INSERT INTO Account_Roles (account_id, role_id) VALUES ($1, $2)", [accountId, roleId])
        }
      }

      await query("COMMIT")
      return { userId, accountId, email: data.email }
    } catch (error) {
      await query("ROLLBACK")
      throw error
    }
  }

  // === CRUD USER RIÊNG ===
  async createUser(data: CreateUserDTO, createdBy: number | null) {
    const res = await query(
      `INSERT INTO Users (first_name, last_name, phone, position, department_id, status, created_by)
       VALUES ($1, $2, $3, $4, $5, 'Active', $6) RETURNING user_id`,
      [data.first_name, data.last_name, data.phone, data.position, data.department_id, createdBy]
    )
    return { user_id: res.rows[0].user_id }
  }

  async getUsers() {
    const res = await query("SELECT * FROM Users ORDER BY user_id")
    return res.rows
  }

  async getUserById(userId: number) {
    const res = await query("SELECT * FROM Users WHERE user_id = $1", [userId])
    if (!res.rows.length) throw new AppError("User not found", 404)
    return res.rows[0]
  }

  async updateUser(userId: number, data: UpdateUserDTO) {
    const fields: string[] = []
    const values: any[] = []
    let idx = 1

    if (data.first_name) { fields.push(`first_name = $${idx++}`); values.push(data.first_name) }
    if (data.last_name) { fields.push(`last_name = $${idx++}`); values.push(data.last_name) }
    if (data.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(data.phone) }
    if (data.position !== undefined) { fields.push(`position = $${idx++}`); values.push(data.position) }
    if (data.department_id !== undefined) { fields.push(`department_id = $${idx++}`); values.push(data.department_id) }
    if (data.status) { fields.push(`status = $${idx++}`); values.push(data.status) }

    if (!fields.length) throw new AppError("No fields to update", 400)

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(userId)

    await query(`UPDATE Users SET ${fields.join(', ')} WHERE user_id = $${idx}`, values)
    return { message: "User updated" }
  }

  async deleteUser(userId: number) {
    await query("DELETE FROM Users WHERE user_id = $1", [userId])
    return { message: "User deleted" }
  }

  // === CRUD ACCOUNT RIÊNG ===
// src/services/auth.services.ts
async createAccount(data: any) {
  let client;
  try {
    // Lấy client transaction
    client = await pool.connect();
    await client.query('BEGIN');

    console.log('Creating account with data:', data);

    // 1. Kiểm tra email tồn tại
    const existingResult = await client.query(
      "SELECT 1 FROM Accounts WHERE email = $1", 
      [data.email]
    );
    if (existingResult.rows.length > 0) {
      throw new AppError("Email already exists", 400);
    }

    // 2. Kiểm tra role tồn tại
    const roleCheck = await client.query(
      "SELECT 1 FROM Roles WHERE role_id = $1 AND status = 'Active'", 
      [data.role_id]
    );
    if (roleCheck.rows.length === 0) {
      throw new AppError("Role not found or inactive", 400);
    }

    // 3. Hash password
    const hashed = await bcrypt.hash(data.password, 10);
    
    // 4. Tạo account
    const accountRes = await client.query(
      `INSERT INTO Accounts (user_id, email, password, status)
       VALUES ($1, $2, $3, $4) RETURNING account_id`,
      [data.user_id || null, data.email, hashed, data.status || 'Active']
    );
    
    const accountId = accountRes.rows[0].account_id;
    console.log('Created account with ID:', accountId);

    // 5. Gán role
    await client.query(
      "INSERT INTO Account_Roles (account_id, role_id) VALUES ($1, $2)",
      [accountId, data.role_id]
    );

    await client.query('COMMIT');
    
    return { 
      accountId,
      email: data.email,
      status: data.status || 'Active'
    };
    
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Create account service error:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}
  async getAccounts() {
  const res = await query(`
    SELECT 
      a.account_id, a.user_id, a.email,a.password, a.status,
      a.date_join, a.last_login, a.last_password_change,
      a.created_at, a.updated_at,
      json_build_object(
        'user_id', u.user_id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'phone', u.phone,
        'position', u.position,
        'status', u.status,
        'department_id', u.department_id
      ) AS user,
      json_build_object(
        'role_id', r.role_id,
        'role_name', r.role_name,
        'description', r.description,
        'status', r.status
      ) AS role
    FROM Accounts a
    LEFT JOIN Users u ON a.user_id = u.user_id
    LEFT JOIN Account_Roles ar ON a.account_id = ar.account_id
    LEFT JOIN Roles r ON ar.role_id = r.role_id
    ORDER BY a.account_id
  `)
  
  return res.rows
}

  async getAccountById(accountId: number) {
    const res = await query("SELECT * FROM Accounts WHERE account_id = $1", [accountId])
    if (!res.rows.length) throw new AppError("Account not found", 404)
    return res.rows[0]
  }

  async updateAccount(accountId: number, data: UpdateAccountDTO) {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.email) {
    fields.push(`email = $${idx++}`);
    values.push(data.email);
  }

  if (data.password) {
    const hashed = await bcrypt.hash(data.password, 10);
    fields.push(`password = $${idx++}`);
    values.push(hashed);
    fields.push(`last_password_change = CURRENT_TIMESTAMP`);
  }

  if (data.status) {
    fields.push(`status = $${idx++}`);
    values.push(data.status);
  }

  // SỬA: Cho phép cập nhật user_id (kể cả NULL)
  if (data.user_id !== undefined) {
    fields.push(`user_id = $${idx++}`);
    values.push(data.user_id === null ? null : data.user_id); // Rõ ràng NULL
  }

  if (!fields.length) {
    throw new AppError("No fields to update", 400);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(accountId);

  const sql = `UPDATE Accounts SET ${fields.join(', ')} WHERE account_id = $${idx} RETURNING account_id`;
  
  try {
    const res = await query(sql, values);
    if (!res.rowCount) throw new AppError("Account not found", 404);
    return { message: "Account updated", account_id: res.rows[0].account_id };
  } catch (error: any) {
    console.error("Update account error:", error);
    throw new AppError(error.message || "Failed to update account", 400);
  }
}

  async deleteAccount(accountId: number) {
    await query("DELETE FROM Accounts WHERE account_id = $1", [accountId])
    return { message: "Account deleted" }
  }

  // === LOGIN, CHANGE PASSWORD, FORGOT (giữ nguyên) ===
  async login(data: LoginDTO) {
  const result = await query(
    `SELECT
        a.account_id, a.user_id, a.email, a.password, a.status,
        u.first_name, u.last_name, u.department_id,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT r.role_name), NULL) AS roles,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT p.permission_name), NULL) AS permissions
     FROM Accounts a
     JOIN Users u ON a.user_id = u.user_id
     LEFT JOIN Account_Roles ar ON a.account_id = ar.account_id
     LEFT JOIN Roles r ON ar.role_id = r.role_id
     LEFT JOIN Role_Permissions rp ON r.role_id = rp.role_id
     LEFT JOIN Permissions p ON rp.permission_id = p.permission_id
     WHERE a.email = $1 AND a.status = 'Active'
     GROUP BY a.account_id, u.user_id, u.department_id`,
    [data.email]
  );

  if (!result.rows.length) throw new AppError("Invalid credentials", 401);
  const account = result.rows[0];
  
  const valid = await bcrypt.compare(data.password, account.password);
  if (!valid) throw new AppError("Invalid credentials", 401);

  await query("UPDATE Accounts SET last_login = CURRENT_TIMESTAMP WHERE account_id = $1", [account.account_id]);

  const payload: JWTPayload = {
    userId: account.user_id,
    accountId: account.account_id,
    email: account.email,
    roles: account.roles ?? [],
    permissions: account.permissions ?? [],
    department_id: account.department_id 
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    permissions: payload.permissions,
    user: {
      userId: account.user_id,
      email: account.email,
      firstName: account.first_name,
      lastName: account.last_name,
      roles: payload.roles,
      department_id: account.department_id
    },
  };
}


  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const res = await query("SELECT password FROM Accounts WHERE user_id = $1", [userId])
    if (!res.rows.length) throw new AppError("Account not found", 404)

    const valid = await bcrypt.compare(oldPassword, res.rows[0].password)
    if (!valid) throw new AppError("Invalid old password", 400)

    const hashed = await bcrypt.hash(newPassword, 10)
    await query(
      `UPDATE Accounts SET password = $1, last_password_change = CURRENT_TIMESTAMP WHERE user_id = $2`,
      [hashed, userId]
    )
    return { message: "Password changed successfully" }
  }

  async forgotPassword(email: string) {
    const res = await query("SELECT account_id FROM Accounts WHERE email = $1", [email])
    if (!res.rows.length) throw new AppError("Email not found", 404)

    const temp = Math.random().toString(36).slice(-12)
    const hashed = await bcrypt.hash(temp, 10)
    await query(
      `UPDATE Accounts SET password = $1, last_password_change = CURRENT_TIMESTAMP WHERE account_id = $2`,
      [hashed, res.rows[0].account_id]
    )
    console.log(`[FORGOT] Temp password for ${email}: ${temp}`)
    return { message: "Temporary password sent to email" }
  }
  // Thêm
  async getUsersByIds(userIds: number[]) {
    if (!userIds.length) return []

    const res = await query(
      `SELECT user_id, first_name, last_name, phone, position, status, department_id, created_at, updated_at
       FROM Users
       WHERE user_id = ANY($1::int[])`,
      [userIds]
    )

    return res.rows
  }
async getUsersByDepartment(departmentId: number) {
  const res = await query(
    `SELECT user_id, first_name, last_name, phone, position, status, department_id, created_at, updated_at
     FROM Users
     WHERE department_id = $1 AND status = 'Active'
     ORDER BY user_id`,
    [departmentId]
  );
  return res.rows;
}
}