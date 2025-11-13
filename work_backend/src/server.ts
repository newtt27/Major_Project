// src/server.ts
import dotenv from "dotenv"
import { createApp } from "./app"
import { setupChatHandler } from "./websocket/chat.handler"
import { setupNotificationHandler } from "./websocket/notification.handler"
import { startScheduler } from "./utils/scheduler"
import notificationService from "./services/notification.services"
import type { Server as SocketIOServer } from "socket.io"

dotenv.config()

const PORT = process.env.PORT || 5000

const { server } = createApp()

// setupChatHandler TRẢ VỀ io → GÁN ĐƯỢC
const io: SocketIOServer = setupChatHandler(server)
setupNotificationHandler(io)

// INJECT io vào service
notificationService.setNotificationIO(io)

startScheduler()

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`WebSocket ready on ws://localhost:${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`AI Service: ${process.env.OLLAMA_URL || "http://localhost:11434"}`)
  console.log(`Notification scheduler started`)
})

process.on("SIGTERM", () => {
  console.log("SIGTERM received: closing server")
  server.close(() => {
    console.log("Server closed")
    process.exit(0)
  })
})