  // src/controllers/auth.controller.ts
  import type { Response } from "express"
  import type { AuthenticatedRequest } from "../middleware/auth.middleware"
  import { AuthService } from "../services/auth.services"
  import { RBACService } from "../services/rbac.services";
  import type { RegisterDTO,
                  LoginDTO,
                  ChangePasswordDTO,
                  ForgotPasswordDTO,
                  CreateUserDTO,
                  UpdateUserDTO,
                  CreateAccountDTO,
                  } from "../dto/auth.dto"
  import { verifyRefreshToken, generateAccessToken } from "../config/jwt"


  const authService = new AuthService()
  const rbacService = new RBACService()
  export class AuthController {
    async register(req: AuthenticatedRequest, res: Response) {
      try {
        const data: RegisterDTO = req.body
        const createdBy = req.user?.userId ?? null

        const result = await authService.register(data, createdBy)
        return res.status(201).json({ message: "User registered successfully", data: result })
      } catch (error: any) {
        return res.status(error?.statusCode || 500).json({ error: error?.message || "Internal server error" })
      }
    }

    async login(req: AuthenticatedRequest, res: Response) {
      try {
        const data: LoginDTO = req.body
        const result = await authService.login(data)

        res.cookie("access_token", result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 15 * 60 * 1000,
        })

        res.cookie("refresh_token", result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.json({
          message: "Login successful",
          userId: result.user.userId,
          user: result.user,
          roles: result.user.roles,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          permissions: result.permissions,
        })
      } catch (error: any) {
        return res.status(error?.statusCode || 500).json({ error: error?.message || "Internal server error" })
      }
    }

    async refreshToken(req: AuthenticatedRequest, res: Response) {
      try {
        const refreshToken = req.cookies?.refresh_token || req.body?.refresh_token

        if (!refreshToken) {
          return res.status(401).json({ error: "Refresh token required" })
        }

        console.log("[REFRESH] Received token (first 20):", refreshToken.substring(0, 20) + "...")

        const decoded = verifyRefreshToken(refreshToken)
        if (!decoded) throw new Error("Invalid payload")

        const newAccessToken = generateAccessToken(decoded)

        res.cookie("access_token", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 15 * 60 * 1000,
        })

        return res.json({ accessToken: newAccessToken })
      } catch (error: any) {
        console.error("[REFRESH] Error:", error.message)
        return res.status(401).json({ error: "Invalid or expired refresh token" })
      }
    }

    async changePassword(req: AuthenticatedRequest, res: Response) {
      try {
        const data: ChangePasswordDTO = req.body
        const userId = req.user!.userId

        const result = await authService.changePassword(userId, data.old_password, data.new_password)
        return res.json(result)
      } catch (error: any) {
        return res.status(error?.statusCode || 500).json({ error: error?.message || "Internal server error" })
      }
    }

    async forgotPassword(req: AuthenticatedRequest, res: Response) {
      try {
        const data: ForgotPasswordDTO = req.body
        const result = await authService.forgotPassword(data.email)
        return res.json(result)
      } catch (error: any) {
        return res.status(error?.statusCode || 500).json({ error: error?.message || "Internal server error" })
      }
    }

    async logout(_req: AuthenticatedRequest, res: Response) {
      res.clearCookie("access_token", { httpOnly: true, sameSite: "strict" })
      res.clearCookie("refresh_token", { httpOnly: true, sameSite: "strict" })
      return res.json({ message: "Logout successful" })
    }

    async getProfile(req: AuthenticatedRequest, res: Response) {
      try {
        return res.json({ user: req.user })
      } catch (error: any) {
        return res.status(500).json({ error: error?.message || "Internal server error" })
      }
    }

  async createUser(req: AuthenticatedRequest, res: Response) {
      const data: CreateUserDTO = req.body
      const createdBy = req.user?.userId ?? null
      const result = await authService.createUser(data, createdBy)
      return res.status(201).json({ message: "User created", data: result })
    }

    async getUsers(_req: AuthenticatedRequest, res: Response) {
      const users = await authService.getUsers()
      return res.json({ data: users })
    }

    async getUserById(req: AuthenticatedRequest, res: Response) {
      const userId = parseInt(req.params.id)
      const user = await authService.getUserById(userId)
      return res.json(user)
    }

    async updateUser(req: AuthenticatedRequest, res: Response) {
      const userId = parseInt(req.params.id)
      const data: UpdateUserDTO = req.body
      const result = await authService.updateUser(userId, data)
      return res.json(result)
    }

    async deleteUser(req: AuthenticatedRequest, res: Response) {
      const userId = parseInt(req.params.id)
      const result = await authService.deleteUser(userId)
      return res.json(result)
    }

    // === CRUD ACCOUNT ===
  async createAccount(req: AuthenticatedRequest, res: Response) {
      try {
        const data: CreateAccountDTO = req.body; // ✅ Sử dụng DTO
        
        console.log('Create account request:', data); // Debug

        // ✅ Validation cơ bản
        if (!data.email || !data.password) {
          return res.status(400).json({ 
            error: "Email và password là bắt buộc" 
          });
        }

        if (!data.role_id) {
          return res.status(400).json({ 
            error: "role_id là bắt buộc" 
          });
        }

        // ✅ Tạo account với role_id
        const account = await authService.createAccount(data);

        return res.status(201).json({
          success: true,
          message: "Account created successfully",
          data: account,
        });
      } catch (error: any) {
        console.error("Create account error:", error);
        return res.status(error?.statusCode || 500).json({ 
          error: error?.message || "Internal server error" 
        });
      }
    }
    async getAccounts(_req: AuthenticatedRequest, res: Response) {
      const accounts = await authService.getAccounts()
      return res.json({ data: accounts })
    }

    async getAccountById(req: AuthenticatedRequest, res: Response) {
      const accountId = parseInt(req.params.id)
      const account = await authService.getAccountById(accountId)
      return res.json(account)
    }

  async updateAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { email, password, status, role_id, user_id } = req.body; 

    
    const account = await authService.updateAccount(Number(id), {
      email,
      password,
      status,
      user_id, 
    });

    if (role_id !== undefined) {
      const currentRoles = await rbacService.getAccountRoles(Number(id));
      for (const role of currentRoles) {
        await rbacService.removeRoleFromAccount(Number(id), role.role_id);
      }
      if (role_id) {
        await rbacService.assignRoleToAccount({
          account_id: Number(id),
          role_id,
        });
      }
    }

    return res.json({
      success: true,
      message: "Account updated successfully",
      data: account,
    });
  } catch (error: any) {
    console.error("Update account error:", error);
    return res.status(error?.statusCode || 500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}
    async deleteAccount(req: AuthenticatedRequest, res: Response) {
      const accountId = parseInt(req.params.id)
      const result = await authService.deleteAccount(accountId)
      return res.json(result)
    }

    //Thêm
    async getUsersByIds(req: AuthenticatedRequest, res: Response) {
      const idsParam = req.query.ids as string
      if (!idsParam) return res.json({ data: [] })

      const userIds = idsParam
        .split(",")
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id))

      const users = await authService.getUsersByIds(userIds)
      return res.json({ data: users })
    }
    async getUsersByDepartment(req: AuthenticatedRequest, res: Response) {
    try {
      const departmentId = parseInt(req.params.department_id)
      if (isNaN(departmentId)) {
        return res.status(400).json({ error: "Invalid department_id" })
      }

      const users = await authService.getUsersByDepartment(departmentId)
      return res.json({ data: users })
    } catch (error: any) {
      return res.status(error?.statusCode || 500).json({ error: error?.message || "Internal server error" })
    }
  }
  }