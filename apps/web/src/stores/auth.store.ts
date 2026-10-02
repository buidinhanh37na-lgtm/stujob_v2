import { create } from "zustand";
import type { SinhVien, NhaTuyenDung, Admin } from "@stujob/types";
import api from "@/lib/axios";

type Role = "sinh_vien" | "nha_tuyen_dung" | "quan_tri_vien";

interface AuthState {
  // Users
  sinhVien: SinhVien | null;
  nhaTuyenDung: NhaTuyenDung | null;
  admin: Admin | null;

  // Loading
  isLoading: boolean;

  // Actions
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
  isLoading: false,

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
    await Promise.allSettled([
      useAuthStore.getState().fetchStudent(),
      useAuthStore.getState().fetchEmployer(),
      useAuthStore.getState().fetchAdmin(),
    ]);
    set({ isLoading: false });
  },

  setStudent: (sv) => set({ sinhVien: sv }),
  setEmployer: (ntd) => set({ nhaTuyenDung: ntd }),
  setAdmin: (a) => set({ admin: a }),

  logoutStudent: async () => {
    try {
      await api.post("/api/auth/student/logout");
    } catch {}
    set({ sinhVien: null });
  },

  logoutEmployer: async () => {
    try {
      await api.post("/api/auth/employer/logout");
    } catch {}
    set({ nhaTuyenDung: null });
  },

  logoutAdmin: async () => {
    try {
      await api.post("/api/auth/admin/logout");
    } catch {}
    set({ admin: null });
  },

  clear: () =>
    set({ sinhVien: null, nhaTuyenDung: null, admin: null }),
}));