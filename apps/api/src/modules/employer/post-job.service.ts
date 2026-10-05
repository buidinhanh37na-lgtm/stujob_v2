import { prisma } from "../../config/prisma";
import { analyzeJobRisk } from "../admin/moderation.service";

export interface PostJobInput {
  nhom_viec_id?: number | null;
  tieu_de: string;
  mo_ta?: string;
  ky_nang_can?: string;
  thu_lao: number;
  loai_cong_viec: "remote" | "onsite";
  so_luong_can?: number;
  so_buoi?: number;
  gio_uoc_tinh?: number;
  han_chot: string;
  ngay_bat_dau?: string | null;
  ngay_ket_thuc?: string | null;
  han_nop_file: string;
  dia_chi_lam_viec?: string;
}

// ============================================================
// Tính phí dịch vụ
// ============================================================
async function calcServiceFee(ntdId: number, salary: number) {
  const [freeConfig, feeConfig] = await Promise.all([
    prisma.cau_hinh_he_thong.findUnique({
      where: { khoa: "so_tin_mien_phi" },
      select: { gia_tri: true },
    }),
    prisma.cau_hinh_he_thong.findUnique({
      where: { khoa: "phi_dich_vu" },
      select: { gia_tri: true },
    }),
  ]);

  const freeLimit = parseInt(freeConfig?.gia_tri || "5", 10);
  const feePercent = parseFloat(feeConfig?.gia_tri || "10");

  const postedCount = await prisma.viec_lam.count({
    where: { nha_tuyen_dung_id: ntdId },
  });

  if (postedCount < freeLimit) return 0;
  return Math.round(salary * (feePercent / 100));
}

// ============================================================
// Tạo tin việc
// ============================================================
export async function createJob(ntdId: number, input: PostJobInput) {
  const type = input.loai_cong_viec;

  // Validate cơ bản
  if (!input.tieu_de.trim())
    throw { status: 400, message: "Vui lòng nhập tiêu đề" };
  if (input.thu_lao <= 0)
    throw { status: 400, message: "Thù lao phải lớn hơn 0" };

  // Validate theo loại
  if (type === "remote") {
    if (!input.han_chot) throw { status: 400, message: "Chọn hạn ứng tuyển" };
    if (!input.han_nop_file)
      throw { status: 400, message: "Chọn hạn nộp sản phẩm" };
    if (input.han_nop_file < input.han_chot)
      throw { status: 400, message: "Hạn nộp phải sau hạn ứng tuyển" };
  } else {
    if (!input.han_chot) throw { status: 400, message: "Chọn hạn ứng tuyển" };
    if (!input.ngay_bat_dau || !input.ngay_ket_thuc)
      throw { status: 400, message: "Chọn ngày bắt đầu và kết thúc" };
    if (!input.han_nop_file)
      throw { status: 400, message: "Chọn hạn nộp sản phẩm" };
    if (input.ngay_bat_dau > input.ngay_ket_thuc)
      throw { status: 400, message: "Ngày kết thúc phải sau ngày bắt đầu" };
    if (input.han_chot > input.ngay_bat_dau)
      throw { status: 400, message: "Hạn ứng tuyển phải trước ngày bắt đầu" };
    if (input.han_nop_file < input.ngay_ket_thuc)
      throw { status: 400, message: "Hạn nộp phải sau ngày kết thúc" };
    if (!input.dia_chi_lam_viec?.trim())
      throw { status: 400, message: "Nhập địa chỉ làm việc" };
  }

  // ============================================================
  // KIỂM DUYỆT TỰ ĐỘNG — chặn tin có từ khóa cấm
  // ============================================================
  const modeConfig = await prisma.cau_hinh_he_thong.findUnique({
    where: { khoa: "che_do_kiem_duyet" },
    select: { gia_tri: true },
  });
  const mode = modeConfig?.gia_tri || "tu_dong"; // tu_dong | thu_cong | tat

  let risk = {
    diem: 0,
    tu_khoa: [] as string[],
    goi_y: "duyet" as "duyet" | "chan" | "canh_bao",
    nguong_chan: 8,
    nguong_canh_bao: 5,
  };

  if (mode !== "tat") {
    risk = await analyzeJobRisk(
      input.tieu_de,
      input.mo_ta || "",
      "",
      input.ky_nang_can || ""
    );
  }

  // Quyết định trạng thái
  const blocked = risk.goi_y === "chan";
  const trangThai: "dang_mo" | "da_dong" = blocked ? "da_dong" : "dang_mo";

  // Tính phí
  const fee = await calcServiceFee(ntdId, input.thu_lao);

  // Tạo job
  const created = await prisma.viec_lam.create({
    data: {
      nha_tuyen_dung_id: ntdId,
      nhom_viec_id: input.nhom_viec_id || null,
      tieu_de: input.tieu_de.trim(),
      mo_ta: input.mo_ta?.trim() || null,
      ky_nang_can: input.ky_nang_can?.trim() || null,
      luong_min: input.thu_lao,
      luong_max: input.thu_lao,
      don_vi_luong: "VNĐ",
      phi_dich_vu: fee,
      loai_cong_viec: type,
      so_luong_can: input.so_luong_can || 1,
      so_buoi: input.so_buoi || 1,
      gio_uoc_tinh: input.gio_uoc_tinh || 0,
      dia_chi_lam_viec:
        type === "remote" ? null : input.dia_chi_lam_viec?.trim() || null,
      han_chot: new Date(input.han_chot),
      ngay_bat_dau:
        type === "remote" || !input.ngay_bat_dau
          ? null
          : new Date(input.ngay_bat_dau),
      ngay_ket_thuc:
        type === "remote" || !input.ngay_ket_thuc
          ? null
          : new Date(input.ngay_ket_thuc),
      han_nop_file: new Date(input.han_nop_file),
      trang_thai: trangThai,
    },
    select: { id: true },
  });

  // Ghi log kiểm duyệt (nếu mode != tat và có risk)
  if (mode !== "tat" && risk.diem > 0) {
    await prisma.kiem_duyet_tin.create({
      data: {
        viec_lam_id: created.id,
        admin_id: null,
        hanh_dong: risk.goi_y === "chan" ? "chan" : risk.goi_y === "canh_bao" ? "canh_bao" : "duyet",
        ly_do: `Kiểm duyệt tự động khi đăng tin (chế độ: ${mode})`,
        diem_rui_ro: risk.diem,
        tu_khoa_phat_hien: risk.tu_khoa.join(", "),
      },
    });
  }

  // Nếu bị chặn → thông báo NTD + throw
  if (blocked) {
    // Thông báo cho NTD biết tin đã bị chặn
    try {
      await prisma.thong_bao_ntd.create({
        data: {
          nha_tuyen_dung_id: ntdId,
          tieu_de: "❌ Tin việc bị chặn tự động",
          noi_dung: `Tin "${input.tieu_de}" có nội dung không phù hợp (điểm rủi ro ${risk.diem}/10). Từ khóa vi phạm: ${risk.tu_khoa.join(", ")}. Vui lòng chỉnh sửa và đăng lại.`,
          loai: "error",
        },
      });
    } catch {
      // ignore
    }

    throw {
      status: 400,
      message: `Tin việc có nội dung không phù hợp (điểm rủi ro ${risk.diem}/10). Từ khóa vi phạm: ${risk.tu_khoa.join(", ")}. Vui lòng chỉnh sửa và đăng lại.`,
    };
  }

  // Tăng bộ đếm
  await prisma.nha_tuyen_dung.update({
    where: { id: ntdId },
    data: { so_tin_da_dang: { increment: 1 } },
  });

  // Thông báo cảnh báo (nếu risk trung bình)
  let message =
    fee > 0
      ? `Đã đăng tin (Phí DV 10%: ${fee.toLocaleString("vi-VN")}đ)`
      : "Đã đăng tin (Miễn phí)";

  if (risk.goi_y === "canh_bao") {
    message += ` ⚠️ Tin việc có dấu hiệu không phù hợp (điểm rủi ro ${risk.diem}/10). Admin sẽ kiểm tra thêm.`;
  }

  return {
    id: created.id,
    service_fee: fee,
    message,
  };
}