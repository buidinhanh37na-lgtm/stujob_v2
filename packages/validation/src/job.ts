import { z } from "zod";

export const postJobSchema = z
  .object({
    nhom_viec_id: z.coerce.number().optional(),
    tieu_de: z.string().min(1, "Tiêu đề không được rỗng"),
    mo_ta: z.string().optional(),
    ky_nang_can: z.string().optional(),
    thu_lao: z.coerce.number().positive("Thù lao phải lớn hơn 0"),
    loai_cong_viec: z.enum(["remote", "onsite", "hybrid"]),
    so_luong_can: z.coerce.number().int().min(1).default(1),
    so_buoi: z.coerce.number().int().min(1).default(1),
    gio_uoc_tinh: z.coerce.number().int().min(0).default(0),
    han_chot: z.string().min(1, "Chọn hạn ứng tuyển"),
    ngay_bat_dau: z.string().nullable().optional(),
    ngay_ket_thuc: z.string().nullable().optional(),
    han_nop_file: z.string().min(1, "Chọn hạn nộp sản phẩm"),
    dia_chi_lam_viec: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.loai_cong_viec === "remote") {
        return data.han_nop_file >= data.han_chot;
      }
      return true;
    },
    {
      message: "Hạn nộp phải sau hạn ứng tuyển",
      path: ["han_nop_file"],
    }
  )
  .refine(
    (data) => {
      if (data.loai_cong_viec === "remote") return true;
      if (!data.ngay_bat_dau || !data.ngay_ket_thuc) return false;
      if (data.ngay_bat_dau > data.ngay_ket_thuc) return false;
      if (data.han_chot > data.ngay_bat_dau) return false;
      if (data.han_nop_file < data.ngay_ket_thuc) return false;
      return true;
    },
    {
      message: "Thời gian làm việc không hợp lệ (hạn ứng tuyển < bắt đầu < kết thúc < hạn nộp)",
      path: ["ngay_bat_dau"],
    }
  );

export type PostJobInput = z.infer<typeof postJobSchema>;