import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("❌ Usage: npx tsx scripts/reset-student.ts <email> <newPassword>");
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error("❌ Password phải >= 6 ký tự");
    process.exit(1);
  }

  const sv = await prisma.sinh_vien.findUnique({ where: { email } });
  if (!sv) {
    console.error(`❌ Không tìm thấy SV với email: ${email}`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.sinh_vien.update({
    where: { id: sv.id },
    data: { mat_khau: hash },
  });

  console.log("✅ Reset password thành công!");
  console.log(`   📧 Email:    ${email}`);
  console.log(`   👤 Họ tên:   ${sv.ho_ten}`);
  console.log(`   🎓 MSSV:     ${sv.ma_sinh_vien}`);
  console.log(`   🔑 Password: ${newPassword}`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });