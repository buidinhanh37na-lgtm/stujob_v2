"use client";

import { io, Socket } from "socket.io-client";

// URL Socket.IO backend (KHÁC với API base URL bình thường)
// - Dev: http://localhost:4000/chat
// - Prod: đổi trong .env.local
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000/chat";

let socket: Socket | null = null;

/**
 * Lazy init socket — chỉ tạo khi lần đầu gọi getSocket()
 * Namespace: /chat
 * Cookie tự động được gửi kèm (same-origin cookie qua withCredentials)
 */
export function getSocket(): Socket {
  if (socket?.connected) return socket;

  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("[SOCKET] connected", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[SOCKET] disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[SOCKET] connect_error:", err.message);
    });
  }

  return socket;
}

/**
 * Ngắt kết nối + clear singleton (dùng khi logout)
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}