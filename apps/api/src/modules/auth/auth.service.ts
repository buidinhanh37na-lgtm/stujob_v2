import crypto from "crypto";
import { prisma } from "../../config/prisma";
import { hashPassword, comparePassword } from "../../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  Role,
} from "../../utils/jwt";

const STUDENT_ROLE: Role = "sinh_vien";

export interface RegisterStudentInput {
  ma_sinh_vien: string;
  ho_ten: string;
  email: string;
  mat_khau: string;
  so_dien_thoai?: string;
  truong?: string;
}

export interface LoginInput {
  email: string;
  mat_khau: string;
}

export async function registerStudent(input: RegisterStudentInput) {
  const email = input.email.trim().toLowerCase();
  const maSV = input.ma_sinh_vien.trim();

  const existing = await prisma.sinh_vien.findFirst({
    where: { OR: [{ email }, { ma_sinh_vien: maSV }] },
    select: { email: true, ma_sinh_vien: true },
  });

  if (existing) {
    if (existing.email === email) {
      throw { status: 400, message: "Email đã tồn tại" };
    }
    throw { status: 400, message: "MSSV đã tồn tại" };
  }

  const hashed = await hashPassword(input.mat_khau);

  const sv = await prisma.sinh_vien.create({
    data: {
      ma_sinh_vien: maSV,
      ho_ten: input.ho_ten.trim(),
      email,
      mat_khau: hashed,
      so_dien_thoai: input.so_dien_thoai?.trim() || null,
      truong: input.truong?.trim() || null,
    },
    select: {
      id: true,
      ma_sinh_vien: true,
      ho_ten: true,
      email: true,
    },
  });

  try {
    await prisma.vi_tien.create({
      data: { sinh_vien_id: sv.id, so_du: 0 },
    });
  } catch {
    // Ignore
  }

  return sv;
}

export async function loginStudent(input: LoginInput) {
  const email = input.email.trim().toLowerCase();

  const sv = await prisma.sinh_vien.findUnique({ where: { email } });
  if (!sv) throw { status: 401, message: "Email hoặc mật khẩu sai" };

  const ok = await comparePassword(input.mat_khau, sv.mat_khau);
  if (!ok) throw { status: 401, message: "Email hoặc mật khẩu sai" };

  if (sv.bi_khoa === 1) {
    throw { status: 403, message: "Tài khoản đã bị khóa" };
  }

  const accessToken = signAccessToken({ userId: sv.id, role: STUDENT_ROLE });
  const refreshToken = signRefreshToken({ userId: sv.id, role: STUDENT_ROLE });

  const { mat_khau, reset_token, reset_expires, ...safe } = sv;
  return { accessToken, refreshToken, sinh_vien: safe };
}

export async function refreshStudentToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw { status: 401, message: "Refresh token không hợp lệ hoặc hết hạn" };
  }

  if (payload.role !== STUDENT_ROLE) {
    throw { status: 403, message: "Sai vai trò" };
  }

  const sv = await prisma.sinh_vien.findUnique({
    where: { id: payload.userId },
    select: { id: true, bi_khoa: true },
  });

  if (!sv || sv.bi_khoa === 1) {
    throw { status: 401, message: "Tài khoản không hợp lệ" };
  }

  return {
    accessToken: signAccessToken({ userId: sv.id, role: STUDENT_ROLE }),
    refreshToken: signRefreshToken({ userId: sv.id, role: STUDENT_ROLE }),
  };
}

export async function getCurrentStudent(id: number) {
  const sv = await prisma.sinh_vien.findUnique({ where: { id } });
  if (!sv) throw { status: 404, message: "Không tìm thấy sinh viên" };

  const { mat_khau, reset_token, reset_expires, ...safe } = sv;
  return safe;
}

export async function forgotPasswordStudent(email: string) {
  const normEmail = email.trim().toLowerCase();
  const sv = await prisma.sinh_vien.findUnique({
    where: { email: normEmail },
    select: { id: true },
  });

  if (!sv) {
    return {
      message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu",
    };
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.sinh_vien.update({
    where: { id: sv.id },
    data: { reset_token: token, reset_expires: expires },
  });

  return {
    message: "Đã tạo link đặt lại mật khẩu (demo)",
    reset_link: `/reset-password?token=${token}&email=${encodeURIComponent(normEmail)}`,
  };
}

export async function resetPasswordStudent(token: string, matKhauMoi: string) {
  const sv = await prisma.sinh_vien.findFirst({
    where: {
      reset_token: token,
      reset_expires: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!sv) throw { status: 400, message: "Link đã hết hạn hoặc không hợp lệ" };

  const hashed = await hashPassword(matKhauMoi);

  await prisma.sinh_vien.update({
    where: { id: sv.id },
    data: {
      mat_khau: hashed,
      reset_token: null,
      reset_expires: null,
    },
  });

  return { message: "Đặt lại mật khẩu thành công" };
}