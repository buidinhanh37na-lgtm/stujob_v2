// ============================================================
// Common types
// ============================================================

export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
};

export type UserRole = "sinh_vien" | "nha_tuyen_dung" | "quan_tri_vien";

export type TrangThaiXacThuc = "chua" | "dang_cho" | "da_xac_thuc";

export type LoaiCongViec = "remote" | "onsite" | "hybrid";

export type MucDoKyNang =
  | "co_ban"
  | "trung_binh"
  | "kha"
  | "gioi"
  | "xuat_sac";