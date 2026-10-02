import crypto from "crypto";
import { prisma } from "../../config/prisma";
import { hashPassword, comparePassword } from "../../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  Role,
} from "../../utils/jwt";

const ADMIN_ROLE: Role = "quan_tri_vien";

export interface LoginInput {
  email: string;
  mat_khau: string;
}

// Admin KHÔNG có register — tài khoản được tạo từ seed/CLI

// ============================================================
// Login Admin
// ============================================================
export async function loginAdmin(input: LoginInput) {
  const email = input.email.trim().toLowerCase();

  const admin = await prisma.quan_tri_vien.findUnique({ where: { email } });
  if (!admin) throw { status: 401, message: "Email hoặc mật khẩu sai" };

  const ok = await comparePassword(input.mat_khau, admin.mat_khau);
  if (!ok) throw { status: 401, message: "Email hoặc mật khẩu sai" };

  if (admin.trang_thai !== "hoat_dong") {
    throw { status: 403, message: "Tài khoản đã bị khóa" };
  }

  const accessToken = signAccessToken({ userId: admin.id, role: ADMIN_ROLE });
  const refreshToken = signRefreshToken({ userId: admin.id, role: ADMIN_ROLE });

  // Update last_login
  await prisma.quan_tri_vien.update({
    where: { id: admin.id },
    data: { last_login: new Date() },
  });

  const { mat_khau, reset_token, reset_expires, ...safe } = admin;
  return { accessToken, refreshToken, admin: safe };
}

// ============================================================
// Refresh
// ============================================================
export async function refreshAdminToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw { status: 401, message: "Refresh token không hợp lệ hoặc hết hạn" };
  }

  if (payload.role !== ADMIN_ROLE) {
    throw { status: 403, message: "Sai vai trò" };
  }

  const admin = await prisma.quan_tri_vien.findUnique({
    where: { id: payload.userId },
    select: { id: true, trang_thai: true },
  });

  if (!admin || admin.trang_thai !== "hoat_dong") {
    throw { status: 401, message: "Tài khoản không hợp lệ" };
  }

  return {
    accessToken: signAccessToken({ userId: admin.id, role: ADMIN_ROLE }),
    refreshToken: signRefreshToken({ userId: admin.id, role: ADMIN_ROLE }),
  };
}

// ============================================================
// Get current Admin
// ============================================================
export async function getCurrentAdmin(id: number) {
  const admin = await prisma.quan_tri_vien.findUnique({ where: { id } });
  if (!admin) throw { status: 404, message: "Không tìm thấy admin" };

  const { mat_khau, reset_token, reset_expires, ...safe } = admin;
  return safe;
}

// ============================================================
// Change password (đã login)
// ============================================================
export async function changeAdminPassword(
  adminId: number,
  matKhauCu: string,
  matKhauMoi: string
) {
  const admin = await prisma.quan_tri_vien.findUnique({
    where: { id: adminId },
    select: { mat_khau: true },
  });
  if (!admin) throw { status: 404, message: "Không tìm thấy admin" };

  const ok = await comparePassword(matKhauCu, admin.mat_khau);
  if (!ok) throw { status: 400, message: "Mật khẩu cũ không đúng" };

  const hashed = await hashPassword(matKhauMoi);
  await prisma.quan_tri_vien.update({
    where: { id: adminId },
    data: { mat_khau: hashed },
  });

  return { message: "Đổi mật khẩu thành công" };
}

// ============================================================
// Forgot
// ============================================================
export async function forgotPasswordAdmin(email: string) {
  const normEmail = email.trim().toLowerCase();
  const admin = await prisma.quan_tri_vien.findUnique({
    where: { email: normEmail },
    select: { id: true },
  });

  if (!admin) {
    return {
      message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu",
    };
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.quan_tri_vien.update({
    where: { id: admin.id },
    data: { reset_token: token, reset_expires: expires },
  });

  return {
    message: "Đã tạo link đặt lại mật khẩu (demo)",
    reset_link: `/reset-password?token=${token}&email=${encodeURIComponent(normEmail)}&role=admin`,
  };
}

// ============================================================
// Reset
// ============================================================
export async function resetPasswordAdmin(token: string, matKhauMoi: string) {
  const admin = await prisma.quan_tri_vien.findFirst({
    where: {
      reset_token: token,
      reset_expires: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!admin) throw { status: 400, message: "Link đã hết hạn hoặc không hợp lệ" };

  const hashed = await hashPassword(matKhauMoi);

  await prisma.quan_tri_vien.update({
    where: { id: admin.id },
    data: {
      mat_khau: hashed,
      reset_token: null,
      reset_expires: null,
    },
  });

  return { message: "Đặt lại mật khẩu thành công" };
}