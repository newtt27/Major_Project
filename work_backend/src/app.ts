// src/app.ts (cập nhật)

import express, { type Application, type Request, type Response } from "express"
import http from "http"
import cookieParser from "cookie-parser"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import morgan from "morgan"
import session from "express-session"
import connectPgSimple from "connect-pg-simple"
import { pool } from "./config/database"
import { errorHandler } from "./middleware/error.middleware"

// Routes
import authRoutes from "./routes/auth.routes"
import projectRoutes from "./routes/project.routes"
import taskRoutes from "./routes/task.routes"
import chatRoutes from "./routes/chat.routes"
import aiRoutes from "./routes/ai.routes"
import notificationRoutes from "./routes/notification.routes"
import rbacRoutes from "./routes/rbac.routes"
import reportRoutes from "./routes/report.routes"
import departmentRoutes from "./routes/department.routes"
import dashboardRoutes from "./routes/dashboard.routes";

// === THÊM MỚI: Swagger ===
import swaggerUi from "swagger-ui-express"
import YAML from "yamljs"
import path from "path"

// Đọc file swagger.yaml
const swaggerDocument = YAML.load(path.join(__dirname, "../swagger.yaml"))

const PgSession = connectPgSimple(session)

export const createApp = (): { app: Application; server: http.Server } => {
  const app = express()
  const server = http.createServer(app)
  // CORS
  app.use(
      cors({
        origin: ["http://localhost:3000", "http://localhost:3001", process.env.CORS_ORIGIN].filter(Boolean) as string[],
        credentials: true,
      })
    )
  // Security
  app.use(helmet())

  // Body parsing
  app.use(express.json({ limit: "10mb" }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use(compression())

  // Logging
  if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"))
  }

  // Session
  app.use(
    session({
      store: new PgSession({ pool, tableName: "session" }),
      secret: process.env.SESSION_SECRET || "fallback_secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: Number.parseInt(process.env.SESSION_MAX_AGE || "86400000"),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      },
    })
  )

  // Static
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  // Health check
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() })
  })

  // === THÊM SWAGGER UI TẠI /api-docs ===
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "list",
        filter: true,
      },
      customCss: `
        .swagger-ui .topbar { background-color: #2c3e50; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .scheme-container { background: #f8f9fa; }
      `,
      customSiteTitle: "Task Management API Docs",
    })
  )

  // API routes
  app.use("/api/auth", authRoutes)
  app.use("/api/projects", projectRoutes)
  app.use("/api/tasks", taskRoutes)
  app.use("/api/chat", chatRoutes)
  app.use("/api/ai", aiRoutes)
  app.use("/api/notifications", notificationRoutes)
  app.use("/api/rbac", rbacRoutes)
  app.use("/api/reports", reportRoutes)
  app.use("/api/departments", departmentRoutes)
    app.use("/api/dashboard", dashboardRoutes);
  // Error handling
  app.use(errorHandler)

  return { app, server }
}