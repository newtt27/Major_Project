// src/websocket/chat.handler.ts
import { Server as HttpServer } from "http"
import { Server as SocketIOServer, type Socket } from "socket.io"
import { verifyAccessToken } from "../config/jwt"
import { ChatService } from "../services/chat.services"
import { AppError } from "../middleware/error.middleware"

const chatService = new ChatService()

interface AuthenticatedSocket extends Socket {
  userId?: number
  chatroomId?: number
}

export const setupChatHandler = (httpServer: HttpServer): void => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    },
  })

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token as string
    if (!token) return next(new AppError("Token required", 401))
    try {
      const decoded = verifyAccessToken(token)
      socket.userId = decoded.userId
      next()
    } catch {
      next(new AppError("Invalid token", 401))
    }
  })

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected via Socket.IO`)

    socket.on("join_chatroom", async (chatroomId: number) => {
      try {
        await chatService.getChatroomById(chatroomId, socket.userId!)
        socket.chatroomId = chatroomId
        socket.join(`room_${chatroomId}`)
        socket.emit("joined", { chatroomId })
      } catch (error: any) {
        socket.emit("error", { message: error.message })
      }
    })

    socket.on("send_message", async (data: { text?: string }) => {
      if (!socket.chatroomId || !socket.userId) return
      try {
        const message = await chatService.sendMessage(
          { chatroom_id: socket.chatroomId, message_text: data.text },
          socket.userId
        )
        io.to(`room_${socket.chatroomId}`).emit("new_message", message)
      } catch (error: any) {
        socket.emit("error", { message: error.message })
      }
    })

    socket.on("typing", (isTyping: boolean) => {
      if (!socket.chatroomId || !socket.userId) return
      socket.to(`room_${socket.chatroomId}`).emit("user_typing", {
        userId: socket.userId,
        isTyping,
      })
    })

    socket.on("disconnect", () => {
      console.log(`User ${socket.userId} disconnected`)
    })
  })
}