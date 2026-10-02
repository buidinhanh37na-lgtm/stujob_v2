import crypto from "crypto";
import { prisma } from "../../config/prisma";
import { hashPassword, comparePassword } from "../../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  Role,
} from "../../utils/jwt";

const EMPLOYER_ROLE: Role = "nha_tuyen_dung";

export interface RegisterEmployerInput {
  loai: "ca_nhan" | "ho_kinh_doanh" | "doanh_nghiep";
  ten_cong_ty: string;
  email: string;
  mat_khau: string;
  cccd?: string;
  ma_so_thue?: string;
  ma_so_hkd?: string;
  nguoi_dai_dien?: string;
  so_dien_thoai?: string;
  dia_chi?: string;
  linh_vuc?: string;
}

export interface LoginInput {
  email: string;
  mat_khau: string;
}

// ============================================================
// Register NTD
// ============================================================
export async function registerEmployer(input: RegisterEmployerInput) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.nha_tuyen_dung.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) throw { status: 400, message: "Email đã tồn tại" };

  // Validate định danh theo loại
  if (input.loai === "ca_nhan" && !input.cccd)
    throw { status: 400, message: "Cá nhân cần CCCD" };
  if (input.loai === "ho_kinh_doanh" && !input.ma_so_hkd)
    throw { status: 400, message: "Hộ kinh doanh cần mã số HKD" };
  if (input.loai === "doanh_nghiep" && !input.ma_so_thue)
    throw { status: 400, message: "Doanh nghiệp cần mã số thuế" };

  const hashed = await hashPassword(input.mat_khau);

  const ntd = await prisma.nha_tuyen_dung.create({
    data: {
      ten_cong_ty: input.ten_cong_ty.trim(),
      email,
      mat_khau: hashed,
      loai: input.loai,
      cccd: input.cccd?.trim() || null,
      ma_so_thue: input.ma_so_thue?.trim() || null,
      ma_so_hkd: input.ma_so_hkd?.trim() || null,
      nguoi_dai_dien: input.nguoi_dai_dien?.trim() || null,
      so_dien_thoai: input.so_dien_thoai?.trim() || null,
      dia_chi: input.dia_chi?.trim() || null,
      linh_vuc: input.linh_vuc?.trim() || null,
      trang_thai_xac_thuc: "chua",
      so_du: 0,
    },
    select: {
      id: true,
      ten_cong_ty: true,
      email: true,
      loai: true,
    },
  });

  // Tạo ví NTD
  try {
    await prisma.vi_ntd.create({
      data: { nha_tuyen_dung_id: ntd.id, so_du: 0 },
    });
  } catch {
    // Ignore
  }

  return ntd;
}

// ============================================================
// Login NTD
// ============================================================
export async function loginEmployer(input: LoginInput) {
  const email = input.email.trim().toLowerCase();

  const ntd = await prisma.nha_tuyen_dung.findUnique({ where: { email } });
  if (!ntd) throw { status: 401, message: "Email hoặc mật khẩu sai" };

  const ok = await comparePassword(input.mat_khau, ntd.mat_khau);
  if (!ok) throw { status: 401, message: "Email hoặc mật khẩu sai" };

  if ((ntd as any).bi_khoa === 1) {
    throw { status: 403, message: "Tài khoản đã bị khóa" };
  }

  const accessToken = signAccessToken({ userId: ntd.id, role: EMPLOYER_ROLE });
  const refreshToken = signRefreshToken({ userId: ntd.id, role: EMPLOYER_ROLE });

  const { mat_khau, reset_token, reset_expires, ...safe } = ntd;
  return { accessToken, refreshToken, nha_tuyen_dung: safe };
}

// ============================================================
// Refresh
// ============================================================
export async function refreshEmployerToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw { status: 401, message: "Refresh token không hợp lệ hoặc hết hạn" };
  }

  if (payload.role !== EMPLOYER_ROLE) {
    throw { status: 403, message: "Sai vai trò" };
  }

  const ntd = await prisma.nha_tuyen_dung.findUnique({
    where: { id: payload.userId },
    select: { id: true, bi_khoa: true } as any,
  });

  if (!ntd || (ntd as any).bi_khoa === 1) {
    throw { status: 401, message: "Tài khoản không hợp lệ" };
  }

  return {
    accessToken: signAccessToken({ userId: ntd.id, role: EMPLOYER_ROLE }),
    refreshToken: signRefreshToken({ userId: ntd.id, role: EMPLOYER_ROLE }),
  };
}

// ============================================================
// Get current NTD
// ============================================================
export async function getCurrentEmployer(id: number) {
  const ntd = await prisma.nha_tuyen_dung.findUnique({ where: { id } });
  if (!ntd) throw { status: 404, message: "Không tìm thấy NTD" };

  const { mat_khau, reset_token, reset_expires, ...safe } = ntd;
  return safe;
}

// ============================================================
// Forgot
// ============================================================
export async function forgotPasswordEmployer(email: string) {
  const normEmail = email.trim().toLowerCase();
  const ntd = await prisma.nha_tuyen_dung.findUnique({
    where: { email: normEmail },
    select: { id: true },
  });

  if (!ntd) {
    return {
      message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu",
    };
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.nha_tuyen_dung.update({
    where: { id: ntd.id },
    data: { reset_token: token, reset_expires: expires },
  });

  return {
    message: "Đã tạo link đặt lại mật khẩu (demo)",
    reset_link: `/reset-password?token=${token}&email=${encodeURIComponent(normEmail)}&role=employer`,
  };
}

// ============================================================
// Reset
// ============================================================
export async function resetPasswordEmployer(token: string, matKhauMoi: string) {
  const ntd = await prisma.nha_tuyen_dung.findFirst({
    where: {
      reset_token: token,
      reset_expires: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!ntd) throw { status: 400, message: "Link đã hết hạn hoặc không hợp lệ" };

  const hashed = await hashPassword(matKhauMoi);

  await prisma.nha_tuyen_dung.update({
    where: { id: ntd.id },
    data: {
      mat_khau: hashed,
      reset_token: null,
      reset_expires: null,
    },
  });

  return { message: "Đặt lại mật khẩu thành công" };
}