import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@stujob.vn";
  const password = "admin123";

  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.quan_tri_vien.findUnique({
    where: { email },
    select: { id: true, ho_ten: true },
  });

  if (!existing) {
    console.log(`❌ Không tìm thấy admin với email: ${email}`);
    console.log("\n📋 Danh sách admin có trong DB:");
    const all = await prisma.quan_tri_vien.findMany({
      select: { id: true, email: true, ho_ten: true },
    });
    all.forEach((a) => console.log(`  #${a.id}: ${a.email} (${a.ho_ten})`));
    return;
  }

  await prisma.quan_tri_vien.update({
    where: { email },
    data: { mat_khau: hash, trang_thai: "hoat_dong" },
  });

  console.log(`✅ Đã reset password cho: ${existing.ho_ten} (${email})`);

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