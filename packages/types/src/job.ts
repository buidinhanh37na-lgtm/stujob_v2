// ============================================================
// Job types
// ============================================================

import type { LoaiCongViec } from "./common";

export type NhomViec = {
  id: number;
  ten_nhom: string;
  icon: string | null;
};

export type ViecLam = {
  id: number;
  nha_tuyen_dung_id: number;
  nhom_viec_id: number | null;
  tieu_de: string;
  mo_ta: string | null;
  ky_nang_can: string | null;
  luong_min: number | null;
  luong_max: number | null;
  don_vi_luong: string | null;
  phi_dich_vu: number;
  loai_cong_viec: LoaiCongViec;
  so_luong_can: number;
  so_buoi: number;
  gio_uoc_tinh: number;
  dia_chi_lam_viec: string | null;
  han_chot: string | null;
  ngay_bat_dau: string | null;
  ngay_ket_thuc: string | null;
  han_nop_file: string | null;
  trang_thai: "dang_mo" | "da_dong";
  created_at: string;

  // Joined fields
  ten_cong_ty?: string;
  ten_nhom?: string;
  icon?: string;
  so_ung_tuyen?: number;

  // Matching score (chỉ có khi trả về cho SV)
  diem_phu_hop?: number;
  chi_tiet_diem?: {
    thoi_gian: number;
    ky_nang: number;
    chuyen_nganh: number;
  } | null;
};

export type MauTinViec = {
  id: number;
  nhom_viec_id: number;
  ten_mau: string;
  tieu_de_goi_y: string | null;
  mo_ta_goi_y: string | null;
  ky_nang_goi_y: string | null;
  luong_min: number | null;
  luong_max: number | null;
};

export type PostJobInput = {
  nhom_viec_id?: number;
  tieu_de: string;
  mo_ta?: string;
  ky_nang_can?: string;
  thu_lao: number;
  loai_cong_viec: LoaiCongViec;
  so_luong_can?: number;
  so_buoi?: number;
  gio_uoc_tinh?: number;
  han_chot: string;
  ngay_bat_dau?: string | null;
  ngay_ket_thuc?: string | null;
  han_nop_file: string;
  dia_chi_lam_viec?: string;
};