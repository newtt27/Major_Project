// src/websocket/notification.handler.ts
import type { Server as SocketIOServer, Socket } from "socket.io"
import { verifyAccessToken } from "../config/jwt"

interface AuthenticatedSocket extends Socket {
  userId?: number
}

export function setupNotificationHandler(io: SocketIOServer): void {
  io.of("/notifications") // Namespace riêng để tối ưu
    .use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token
      if (!token) return next(new Error("Token required"))

      try {
        const decoded = verifyAccessToken(token)
        socket.userId = decoded.userId
        next()
      } catch {
        next(new Error("Invalid token"))
      }
    })
    .on("connection", (socket: AuthenticatedSocket) => {
      const userId = socket.userId!
      console.log(`[Notification WS] User ${userId} connected`)

      socket.join(`user:${userId}`)

      socket.on("disconnect", () => {
        console.log(`[Notification WS] User ${userId} disconnected`)
      })
    })
}

export function emitNotificationToUser(io: SocketIOServer, userId: number, notification: any) {
  io.of("/notifications").to(`user:${userId}`).emit("notification", {
    type: "NEW_NOTIFICATION",
    data: notification,
  })
}