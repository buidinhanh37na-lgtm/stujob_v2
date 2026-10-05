import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { env } from "../config/env";
import { socketAuth, AuthedSocket } from "./auth";
import { registerChatHandlers } from "./chat.handler";

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer): SocketServer {
  if (io) return io;

  io = new SocketServer(httpServer, {
    cors: {
      origin: env.WEB_URL,
      credentials: true,
    },
    // Cho phép cả polling + websocket (mặc định)
    transports: ["websocket", "polling"],
  });

  // Namespace /chat
  const chatNs = io.of("/chat");

  // Middleware auth
  chatNs.use((socket, next) => socketAuth(socket as AuthedSocket, next));

  // Handle connection
  chatNs.on("connection", (socket) => {
    registerChatHandlers(chatNs as any, socket as AuthedSocket);
  });

  console.log(`[SOCKET] Socket.IO initialized — CORS: ${env.WEB_URL}`);
  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.IO chưa được khởi tạo");
  return io;
}