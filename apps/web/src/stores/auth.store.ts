import { create } from "zustand";
import api from "@/lib/axios";

export interface SinhVien {
  id: number;
  ma_sinh_vien: string;
  ho_ten: string;
  email: string;
  so_dien_thoai?: string | null;
  truong?: string | null;
  khoa?: string | null;
  chuyen_nganh?: string | null;
  nam_hoc?: number | null;
  gpa?: number | null;
  anh_dai_dien?: string | null;
  mo_ta?: string | null;
  trang_thai_xac_thuc?: string;
  bi_khoa?: number;
  diem_danh_gia?: number;
  so_lan_danh_gia?: number;
}

export interface NhaTuyenDung {
  id: number;
  ten_cong_ty: string;
  email: string;
  loai?: string;
  cccd?: string | null;
  ma_so_thue?: string | null;
  ma_so_hkd?: string | null;
  nguoi_dai_dien?: string | null;
  so_dien_thoai?: string | null;
  dia_chi?: string | null;
  website?: string | null;
  linh_vuc?: string | null;
  mo_ta?: string | null;
  logo?: string | null;
  trang_thai_xac_thuc?: string;
  so_du?: number;
  so_tin_da_dang?: number;
  bi_khoa?: number;
}

export interface Admin {
  id: number;
  ho_ten: string;
  email: string;
  vai_tro: string;
  trang_thai: string;
  last_login?: string | null;
}

interface AuthState {
  sinhVien: SinhVien | null;
  nhaTuyenDung: NhaTuyenDung | null;
  admin: Admin | null;
  isLoading: boolean;

  fetchStudent: () => Promise<SinhVien | null>;
  fetchEmployer: () => Promise<NhaTuyenDung | null>;
  fetchAdmin: () => Promise<Admin | null>;
  fetchAll: () => Promise<void>;

  setStudent: (sv: SinhVien | null) => void;
  setEmployer: (ntd: NhaTuyenDung | null) => void;
  setAdmin: (a: Admin | null) => void;

  logoutStudent: () => Promise<void>;
  logoutEmployer: () => Promise<void>;
  logoutAdmin: () => Promise<void>;

  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  sinhVien: null,
  nhaTuyenDung: null,
  admin: null,
  isLoading: true,

  fetchStudent: async () => {
    try {
      const { data } = await api.get("/api/auth/student/me");
      if (data.success && data.sinh_vien) {
        set({ sinhVien: data.sinh_vien });
        return data.sinh_vien;
      }
    } catch {
      set({ sinhVien: null });
    }
    return null;
  },

  fetchEmployer: async () => {
    try {
      const { data } = await api.get("/api/auth/employer/me");
      if (data.success && data.nha_tuyen_dung) {
        set({ nhaTuyenDung: data.nha_tuyen_dung });
        return data.nha_tuyen_dung;
      }
    } catch {
      set({ nhaTuyenDung: null });
    }
    return null;
  },

  fetchAdmin: async () => {
    try {
      const { data } = await api.get("/api/auth/admin/me");
      if (data.success && data.admin) {
        set({ admin: data.admin });
        return data.admin;
      }
    } catch {
      set({ admin: null });
    }
    return null;
  },

  fetchAll: async () => {
    set({ isLoading: true });

    const path =
      typeof window !== "undefined" ? window.location.pathname : "";

    const isEmployer = path.startsWith("/employer");
    const isAdmin = path.startsWith("/admin");

    try {
      if (isAdmin) {
        await useAuthStore.getState().fetchAdmin();
      } else if (isEmployer) {
        await useAuthStore.getState().fetchEmployer();
      } else {
        await useAuthStore.getState().fetchStudent();
      }
    } finally {
      set({ isLoading: false });
    }
  },

  setStudent: (sv) => set({ sinhVien: sv }),
  setEmployer: (ntd) => set({ nhaTuyenDung: ntd }),
  setAdmin: (a) => set({ admin: a }),

  logoutStudent: async () => {
    try {
      await api.post("/api/auth/student/logout");
    } catch {
      // ignore
    }
    set({ sinhVien: null });
  },

  logoutEmployer: async () => {
    try {
      await api.post("/api/auth/employer/logout");
    } catch {
      // ignore
    }
    set({ nhaTuyenDung: null });
  },

  logoutAdmin: async () => {
    try {
      await api.post("/api/auth/admin/logout");
    } catch {
      // ignore
    }
    set({ admin: null });
  },

  clear: () => set({ sinhVien: null, nhaTuyenDung: null, admin: null }),
}));