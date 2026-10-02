// ============================================================
// Application types
// ============================================================

export type TrangThaiUngTuyen =
  | "cho_duyet"
  | "da_chap_nhan"
  | "tu_choi"
  | "hoan_thanh";

export type LoaiUngTuyen = "ung_tuyen" | "loi_moi";

export type UngTuyen = {
  id: number;
  sinh_vien_id: number;
  viec_lam_id: number;
  loai: LoaiUngTuyen;
  loi_nhan: string | null;
  trang_thai: TrangThaiUngTuyen;
  ngay_moi: string | null;
  created_at: string;

  // Joined
  tieu_de?: string;
  ten_cong_ty?: string;
  luong_min?: number | null;
  luong_max?: number | null;
  ma_sinh_vien?: string;
  ho_ten?: string;
  truong?: string | null;
  gpa?: number | null;
  diem_danh_gia?: number;
  so_lan_danh_gia?: number;
  ky_nang?: Array<{ ten_ky_nang: string; muc_do: string }>;
};

export type NhiemVu = {
  id: number;
  sinh_vien_id: number;
  viec_lam_id: number | null;
  ten_nhiem_vu: string;
  mo_ta: string | null;
  han_nop: string | null;
  trang_thai: "dang_lam" | "cho_duyet" | "hoan_thanh" | "qua_han";
  file_san_pham: string | null;
  file_xem_truoc: string | null;
  created_at: string;

  // Joined
  ten_viec?: string | null;
};