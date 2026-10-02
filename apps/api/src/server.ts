import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const PORT = env.PORT;

async function start() {
  try {
    await prisma.$connect();
    console.log("[OK] Ket noi MySQL thanh cong");
  } catch (err) {
    console.error("[ERROR] Ket noi MySQL that bai:", err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log("");
    console.log("[SERVER] Stujob API dang chay:");
    console.log(`   -> http://localhost:${PORT}`);
    console.log(`   -> Health:  http://localhost:${PORT}/api/health`);
    console.log(`   -> DB Test: http://localhost:${PORT}/api/db-test`);
    console.log("");
  });
}

start();