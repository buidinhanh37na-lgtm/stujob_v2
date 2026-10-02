import { z } from "zod";

// ============================================================
// Sinh viên
// ============================================================

export const registerSinhVienSchema = z.object({
  ma_sinh_vien: z.string().min(1, "MSSV không được rỗng"),
  ho_ten: z.string().min(1, "Họ tên không được rỗng"),
  email: z.string().email("Email không hợp lệ"),
  mat_khau: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  so_dien_thoai: z.string().optional(),
  truong: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  mat_khau: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  mat_khau: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

// ============================================================
// Nhà tuyển dụng
// ============================================================

export const registerEmployerSchema = z
  .object({
    loai: z.enum(["ca_nhan", "ho_kinh_doanh", "doanh_nghiep"]),
    ten_cong_ty: z.string().min(1, "Tên không được rỗng"),
    email: z.string().email("Email không hợp lệ"),
    mat_khau: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    cccd: z.string().optional(),
    ma_so_thue: z.string().optional(),
    ma_so_hkd: z.string().optional(),
    nguoi_dai_dien: z.string().optional(),
    so_dien_thoai: z.string().optional(),
    dia_chi: z.string().optional(),
    linh_vuc: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.loai === "ca_nhan" && !data.cccd) return false;
      if (data.loai === "ho_kinh_doanh" && !data.ma_so_hkd) return false;
      if (data.loai === "doanh_nghiep" && !data.ma_so_thue) return false;
      return true;
    },
    {
      message: "Thông tin định danh không đầy đủ cho loại tài khoản này",
    }
  );

// ============================================================
// Types inference
// ============================================================

export type RegisterSinhVienInput = z.infer<typeof registerSinhVienSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterEmployerInput = z.infer<typeof registerEmployerSchema>;