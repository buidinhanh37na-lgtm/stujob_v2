// ============================================================
// Auth types
// ============================================================

import type { TrangThaiXacThuc } from "./common";

export type SinhVien = {
  id: number;
  ma_sinh_vien: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string | null;
  truong: string | null;
  khoa: string | null;
  chuyen_nganh: string | null;
  nam_hoc: number | null;
  gpa: number | null;
  anh_dai_dien: string | null;
  mo_ta: string | null;
  diem_danh_gia: number;
  so_lan_danh_gia: number;
  trang_thai_xac_thuc: TrangThaiXacThuc;
  created_at: string;
};

export type NhaTuyenDung = {
  id: number;
  ten_cong_ty: string;
  email: string;
  loai: "ca_nhan" | "ho_kinh_doanh" | "doanh_nghiep";
  ma_so_thue: string | null;
  ma_so_hkd: string | null;
  cccd: string | null;
  nguoi_dai_dien: string | null;
  so_dien_thoai: string | null;
  dia_chi: string | null;
  linh_vuc: string | null;
  mo_ta: string | null;
  logo: string | null;
  website: string | null;
  trang_thai_xac_thuc: TrangThaiXacThuc;
  so_du: number;
  so_tin_da_dang: number;
  created_at: string;
};

export type Admin = {
  id: number;
  ho_ten: string;
  email: string;
  vai_tro: "super_admin" | "admin" | "moderator" | "support";
  trang_thai: "hoat_dong" | "bi_khoa";
  last_login: string | null;
  created_at: string;
};

export type LoginResponse = {
  success: boolean;
  message?: string;
  sinh_vien?: SinhVien;
  nha_tuyen_dung?: NhaTuyenDung;
  admin?: Admin;
};