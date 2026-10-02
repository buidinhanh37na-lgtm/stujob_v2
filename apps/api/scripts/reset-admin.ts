import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@stujob.vn";
  const password = "admin123";

  const hash = await bcrypt.hash(password, 10);
  console.log("🔐 Hash mới:", hash);

  const existing = await prisma.quan_tri_vien.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    await prisma.quan_tri_vien.update({
      where: { email },
      data: { mat_khau: hash, trang_thai: "hoat_dong" },
    });
    console.log(`✅ Đã reset password cho admin: ${email}`);
  } else {
    await prisma.quan_tri_vien.create({
      data: {
        ho_ten: "Super Admin",
        email,
        mat_khau: hash,
        vai_tro: "super_admin",
        trang_thai: "hoat_dong",
      },
    });
    console.log(`✅ Đã tạo admin mới: ${email}`);
  }

  // Verify
  const check = await prisma.quan_tri_vien.findUnique({
    where: { email },
    select: { mat_khau: true },
  });

  if (check) {
    const ok = await bcrypt.compare(password, check.mat_khau);
    console.log(`🧪 Verify password "${password}":`, ok ? "✅ OK" : "❌ FAIL");
  }
}

main()
  .catch((e) => {
    console.error("❌ Lỗi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());