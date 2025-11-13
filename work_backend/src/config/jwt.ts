import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

export const JWT_SECRET: jwt.Secret =
  process.env.JWT_SECRET || "your_jwt_secret"

export const JWT_REFRESH_SECRET: jwt.Secret =
  process.env.JWT_REFRESH_SECRET || "your_refresh_secret"

export const JWT_EXPIRES_IN: jwt.SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]) || "15m"

export const JWT_REFRESH_EXPIRES_IN: jwt.SignOptions["expiresIn"] =
  (process.env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"]) || "7d"

export interface JWTPayload {
  userId: number
  accountId: number
  email: string
  roles: string[]
  permissions?: string[]
  department_id?: number
}

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: "HS256",
  })
}

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    algorithm: "HS256",
  })
}

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload
}
