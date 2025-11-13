import { Pool } from "pg"
import dotenv from "dotenv"

dotenv.config()

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "123456789",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on("connect", () => {
  console.log("Database connected successfully")
})

pool.on("error", (err) => {
  console.error("Unexpected database error:", err)
  process.exit(-1)
})

export const query = async (text: string, params?: any[]) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("Executed query", { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}
