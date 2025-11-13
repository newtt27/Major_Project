// src/websocket/chat.handler.ts
import { Server as HttpServer } from "http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { verifyAccessToken } from "../config/jwt";
import { ChatService } from "../services/chat.services";
import { AppError } from "../middleware/error.middleware";

const chatService = new ChatService();

interface AuthenticatedSocket extends Socket {
  userId?: number;
  chatroomId?: number;
}

export const setupChatHandler = (httpServer: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    },
  });

  // === XÁC THỰC TOKEN ===
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new AppError("Token required", 401));
    try {
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new AppError("Invalid token", 401));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`[WS] User ${socket.userId} connected`);

    // === JOIN CHATROOM ===
    socket.on("join_chatroom", async (chatroomId: number) => {
      try {
        await chatService.getChatroomById(chatroomId, socket.userId!);
        socket.chatroomId = chatroomId;
        socket.join(`room_${chatroomId}`);
        socket.emit("joined", { chatroomId });
      } catch (error: any) {
        socket.emit("error", { message: error.message });
      }
    });

    // === GỬI TEXT QUA WS (không file) ===
    socket.on("send_message", async (data: { message_text: string }) => {
      if (!socket.chatroomId || !socket.userId || !data.message_text?.trim()) return;

      try {
        const message = await chatService.sendMessage(
          {
            chatroom_id: socket.chatroomId,
            message_text: data.message_text.trim(),
          },
          socket.userId,
          undefined // Không có file
        );

        io.to(`room_${socket.chatroomId}`).emit("new_message", message);
      } catch (error: any) {
        socket.emit("error", { message: error.message });
      }
    });

    // === TYPING ===
    socket.on("typing", (isTyping: boolean) => {
      if (!socket.chatroomId || !socket.userId) return;
      socket.to(`room_${socket.chatroomId}`).emit("typing", {
        userId: socket.userId,
        isTyping,
      });
    });

    // === MARK AS READ ===
    socket.on("mark_read", async (chatroomId: number) => {
      if (!socket.userId) return;
      try {
        await chatService.markAsRead(chatroomId, socket.userId);
        io.to(`room_${chatroomId}`).emit("messages_read", {
          chatroomId,
          userId: socket.userId,
        });
      } catch (error: any) {
        socket.emit("error", { message: error.message });
      }
    });

    // === DISCONNECT ===
    socket.on("disconnect", () => {
      console.log(`[WS] User ${socket.userId} disconnected`);
      if (socket.chatroomId) {
        socket.leave(`room_${socket.chatroomId}`);
      }
    });
  });

  return io;
};