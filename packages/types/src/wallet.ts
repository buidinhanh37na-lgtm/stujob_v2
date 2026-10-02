// ============================================================
// Wallet & Escrow types
// ============================================================

export type LoaiGiaoDich = "thu_nhap" | "rut_tien";

export type TrangThaiGiaoDich = "cho_xu_ly" | "thanh_cong" | "that_bai";

export type GiaoDich = {
  id: number;
  sinh_vien_id: number;
  nhiem_vu_id: number | null;
  so_tien: number;
  phi_san: number;
  loai: LoaiGiaoDich;
  mo_ta: string | null;
  trang_thai: TrangThaiGiaoDich;
  created_at: string;
};

export type TrangThaiEscrow =
  | "cho_ky_quy"
  | "da_ky_quy"
  | "da_giai_ngan"
  | "huy"
  | "cho_nap"
  | "da_nap"
  | "cho_nghiem_thu"
  | "hoan_tien";

export type BaoDamThanhToan = {
  id: number;
  ung_tuyen_id: number | null;
  nha_tuyen_dung_id: number;
  sinh_vien_id: number;
  viec_lam_id: number | null;
  so_tien: number;
  phi_dich_vu: number;
  ma_giao_dich: string | null;
  trang_thai: TrangThaiEscrow;
  ghi_chu: string | null;
  ngay_giai_ngan: string | null;
  created_at: string;

  // Joined
  tieu_de?: string;
  ho_ten?: string;
  ma_sinh_vien?: string;
};

export type YeuCauRutTien = {
  id: number;
  sinh_vien_id: number;
  so_tien: number;
  ngan_hang: string;
  so_tai_khoan: string;
  chu_tai_khoan: string;
  trang_thai: "cho_xu_ly" | "da_duyet" | "da_chuyen" | "tu_choi";
  ghi_chu: string | null;
  ly_do_tu_choi: string | null;
  created_at: string;
};