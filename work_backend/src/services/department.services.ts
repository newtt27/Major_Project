// src/services/department.service.ts
import { pool } from "../config/database";
import { CreateDepartmentDto, UpdateDepartmentDto } from "../dto/department.dto";
import { AppError } from "../middleware/error.middleware";

export class DepartmentService {
  async getAll() {
    const query = `
      SELECT
        d.*,
        u.first_name || ' ' || u.last_name AS manager_name
      FROM Departments d
      LEFT JOIN Users u ON d.manager_id = u.user_id
      WHERE d.status = 'Active'
      ORDER BY d.created_at DESC
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  async getById(id: number) {
    const query = `
      SELECT
        d.*,
        u.first_name || ' ' || u.last_name AS manager_name
      FROM Departments d
      LEFT JOIN Users u ON d.manager_id = u.user_id
      WHERE d.department_id = $1
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0] || null;
  }

  async create(dto: CreateDepartmentDto) {
    const { department_name, description, manager_id } = dto;

    const check = await pool.query(
      "SELECT 1 FROM Departments WHERE LOWER(department_name) = LOWER($1)",
      [department_name]
    );
    if (check.rowCount! > 0) {
      throw new AppError("Department name already exists", 400);
    }

    const query = `
      INSERT INTO Departments (department_name, description, manager_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const res = await pool.query(query, [
      department_name,
      description || null,
      manager_id || null,
    ]);
    return res.rows[0];
  }

  async update(id: number, dto: UpdateDepartmentDto) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.department_name !== undefined) {
      const check = await pool.query(
        "SELECT 1 FROM Departments WHERE LOWER(department_name) = LOWER($1) AND department_id <> $2",
        [dto.department_name, id]
      );
      if (check.rowCount! > 0) {
        throw new AppError("Department name already exists", 400);
      }
      updates.push(`department_name = $${paramIndex++}`);
      values.push(dto.department_name);
    }

    if (dto.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(dto.description);
    }

    if (dto.manager_id !== undefined) {
      updates.push(`manager_id = $${paramIndex++}`);
      values.push(dto.manager_id);
    }

    if (dto.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(dto.status);
    }

    if (updates.length === 0) {
      throw new AppError("No fields to update", 400);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE Departments
      SET ${updates.join(", ")}
      WHERE department_id = $${paramIndex}
      RETURNING *
    `;

    const res = await pool.query(query, values);
    return res.rows[0] || null;
  }

  async delete(id: number) {
    const res = await pool.query(
      `UPDATE Departments
       SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP
       WHERE department_id = $1 AND status = 'Active'
       RETURNING *`,
      [id]
    );
    return res.rowCount! > 0;
  }

  async getMyDepartmentUsers(managerId: number) {
    if (!managerId || isNaN(managerId)) {
      throw new AppError("Invalid manager ID", 400);
    }

    // B1: Tìm phòng ban do manager quản lý
    const deptResult = await pool.query(
      `SELECT department_id, department_name
       FROM Departments
       WHERE manager_id = $1 AND status = 'Active'`,
      [managerId]
    );

    if (deptResult.rows.length === 0) {
      throw new AppError("Bạn không quản lý phòng ban nào", 403);
    }

    const { department_id, department_name } = deptResult.rows[0];

    // B2: LẤY CHỈ TỪ BẢNG USERS – KHÔNG JOIN ACCOUNTS
    const usersResult = await pool.query(
      `SELECT
         u.user_id,
         u.first_name,
         u.last_name,
         u.phone,
         u.position,
         'Chưa có email' AS email,  -- Không có email vì không JOIN Accounts
         u.status,
         u.created_at
       FROM Users u
       WHERE u.department_id = $1
         AND u.status = 'Active'
         AND u.user_id <> $2  -- Loại trừ chính manager
       ORDER BY u.last_name, u.first_name`,
      [department_id, managerId]
    );

    return {
      department: { department_id, department_name },
      users: usersResult.rows,
      total: usersResult.rowCount || 0
    };
  }
}

export const departmentService = new DepartmentService();