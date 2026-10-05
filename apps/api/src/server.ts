import http from "http";
import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { initSocket } from "./socket";

const PORT = env.PORT;
const IS_PROD = process.env.NODE_ENV === "production";

async function start() {
  try {
    await prisma.$connect();
    console.log("[OK] Ket noi MySQL thanh cong");
  } catch (err) {
    console.error("[ERROR] Ket noi MySQL that bai:", err);
  }

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log("");
    console.log("[SERVER] Stujob API dang chay:");
    console.log(`   -> HTTP:      http://localhost:${PORT}`);
    console.log(`   -> Health:    http://localhost:${PORT}/api/health`);
    console.log(`   -> DB Test:   http://localhost:${PORT}/api/db-test`);
    console.log(`   -> Socket.IO: ws://localhost:${PORT}/chat`);
    console.log(`   -> Env:       ${IS_PROD ? "PRODUCTION" : "DEVELOPMENT"}`);
    console.log("");
  });

  // ============================================================
  // GRACEFUL SHUTDOWN — đóng kết nối đẹp khi Ctrl+C / Docker stop
  // ============================================================
  const shutdown = async (signal: string) => {
    console.log(`\n[SHUTDOWN] Nhận signal: ${signal}`);

    // Ngừng nhận request mới
    server.close(() => {
      console.log("[SHUTDOWN] HTTP server đã đóng");
    });

    // Đóng Prisma sau 1s
    setTimeout(async () => {
      try {
        await prisma.$disconnect();
        console.log("[SHUTDOWN] Prisma đã ngắt kết nối");
      } catch (err) {
        console.error("[SHUTDOWN] Lỗi disconnect Prisma:", err);
      }
      process.exit(0);
    }, 1000);

    // Force exit sau 10s nếu treo
    setTimeout(() => {
      console.error("[SHUTDOWN] Force exit sau 10s");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start();