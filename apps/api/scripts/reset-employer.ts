import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@gmail.com";
  const password = "123456";

  const hash = await bcrypt.hash(password, 10);
  console.log("🔐 Hash mới:", hash);

  const existing = await prisma.nha_tuyen_dung.findUnique({
    where: { email },
    select: { id: true, ten_cong_ty: true },
  });

  if (!existing) {
    console.log(`❌ Không tìm thấy NTD với email: ${email}`);
    console.log("\n📋 Danh sách NTD có trong DB:");
    const all = await prisma.nha_tuyen_dung.findMany({
      select: { id: true, email: true, ten_cong_ty: true },
      take: 10,
    });
    all.forEach((n) =>
      console.log(`  #${n.id}: ${n.email} (${n.ten_cong_ty})`)
    );
    return;
  }

  await prisma.nha_tuyen_dung.update({
    where: { email },
    data: { mat_khau: hash },
  });

  console.log(`✅ Đã reset password cho: ${existing.ten_cong_ty} (${email})`);

  // Verify
  const check = await prisma.nha_tuyen_dung.findUnique({
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