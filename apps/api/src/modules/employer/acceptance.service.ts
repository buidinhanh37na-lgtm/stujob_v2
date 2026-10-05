import fs from "fs";
import path from "path";
import { prisma } from "../../config/prisma";
import { UPLOAD_ROOT } from "../../config/upload";
import { notifyNTD } from "./_helpers";

// ============================================================
// List bài nộp của SV cho NTD
// ============================================================
export async function listAcceptance(ntdId: number) {
  const items = await prisma.nhiem_vu.findMany({
    where: {
      viec_lam: { nha_tuyen_dung_id: ntdId },
    },
    orderBy: { created_at: "desc" },
    include: {
      viec_lam: {
        select: {
          id: true,
          tieu_de: true,
          nha_tuyen_dung_id: true,
          luong_min: true,
          luong_max: true,
        },
      },
      sinh_vien: {
        select: {
          id: true,
          ho_ten: true,
          ma_sinh_vien: true,
        },
      },
    },
  });

  return {
    items: items.map((nv) => ({
      id: nv.id,
      sinh_vien_id: nv.sinh_vien_id,
      viec_lam_id: nv.viec_lam_id,
      ten_nhiem_vu: nv.ten_nhiem_vu,
      mo_ta: nv.mo_ta,
      han_nop: nv.han_nop,
      trang_thai_nv: nv.trang_thai,
      file_goc: nv.file_san_pham,
      file_xem_truoc: nv.file_xem_truoc,
      created_at: nv.created_at,
      // SV info
      ho_ten: nv.sinh_vien.ho_ten,
      ma_sinh_vien: nv.sinh_vien.ma_sinh_vien,
      // Job info
      tieu_de: nv.viec_lam?.tieu_de || "",
      thu_lao:
        (Number(nv.viec_lam?.luong_min || 0) +
          Number(nv.viec_lam?.luong_max || 0)) /
        2,
    })),
  };
}

// ============================================================
// Lấy file bài nộp để serve
// ============================================================
export async function getSubmissionFile(ntdId: number, taskId: number) {
  // Query task + job (LEFT JOIN để chịu task không có viec_lam_id)
  const nv = await prisma.nhiem_vu.findUnique({
    where: { id: taskId },
    include: {
      viec_lam: { select: { nha_tuyen_dung_id: true } },
    },
  });

  if (!nv) throw { status: 404, message: "Không tìm thấy" };

  // Check ownership: trực tiếp hoặc qua ung_tuyen
  let owns = false;
  if (nv.viec_lam?.nha_tuyen_dung_id === ntdId) owns = true;
  else {
    const chk = await prisma.ung_tuyen.findFirst({
      where: {
        sinh_vien_id: nv.sinh_vien_id,
        viec_lam_id: nv.viec_lam_id || 0,
        viec_lam: { nha_tuyen_dung_id: ntdId },
      },
      select: { id: true },
    });
    if (chk) owns = true;
  }
  if (!owns) throw { status: 403, message: "Không có quyền" };

  // Chọn file: nếu đã nghiệm thu → file gốc; chưa → preview
  const isDone = nv.trang_thai === "hoan_thanh";

  let filePath: string | null = null;
  let contentType = "application/octet-stream";

  if (isDone && nv.file_san_pham) {
    filePath = path.join(UPLOAD_ROOT, "..", nv.file_san_pham);
  } else {
    // Chưa nghiệm thu → preview, fallback file gốc
    if (nv.file_xem_truoc) {
      const p = path.join(UPLOAD_ROOT, "..", nv.file_xem_truoc);
      if (fs.existsSync(p)) filePath = p;
    }
    if (!filePath && nv.file_san_pham) {
      filePath = path.join(UPLOAD_ROOT, "..", nv.file_san_pham);
    }
  }

  if (!filePath || !fs.existsSync(filePath)) {
    throw { status: 404, message: "File không tồn tại" };
  }

  // Đoán MIME
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  contentType = mimeMap[ext] || "application/octet-stream";

  return { filePath, contentType, isDone };
}

// ============================================================
// Nghiệm thu
// ============================================================
export async function acceptTask(
  ntdId: number,
  taskId: number,
  chapNhan: boolean,
  nhanXet: string
) {
  const nv = await prisma.nhiem_vu.findUnique({
    where: { id: taskId },
    include: {
      viec_lam: {
        select: { id: true, nha_tuyen_dung_id: true, tieu_de: true },
      },
    },
  });
  if (!nv) throw { status: 404, message: "Không tìm thấy" };
  if (nv.viec_lam?.nha_tuyen_dung_id !== ntdId)
    throw { status: 403, message: "Không có quyền" };

  if (nv.trang_thai === "hoan_thanh")
    throw { status: 400, message: "Đã nghiệm thu rồi" };

  // ============ TRƯỜNG HỢP TỪ CHỐI ============
  if (!chapNhan) {
    await prisma.$transaction(async (tx) => {
      await tx.nhiem_vu.update({
        where: { id: taskId },
        data: { trang_thai: "dang_lam" },
      });

      try {
        await tx.thong_bao.create({
          data: {
            sinh_vien_id: nv.sinh_vien_id,
            tieu_de: "Bài nộp cần chỉnh sửa",
            noi_dung: nhanXet || "Vui lòng xem lại và nộp lại",
            loai: "info",
          },
        });
      } catch {}
    });
    return { message: "Đã gửi yêu cầu chỉnh sửa" };
  }

  // ============ TRƯỜNG HỢP CHẤP NHẬN ============
  // Đếm số nhiệm vụ đã hoàn thành của SV (TRƯỚC đơn này)
  const completedCount = await prisma.nhiem_vu.count({
    where: { sinh_vien_id: nv.sinh_vien_id, trang_thai: "hoan_thanh" },
  });

  const isFree = completedCount < 10;

  await prisma.$transaction(async (tx) => {
    // 1. Update nhiệm vụ
    await tx.nhiem_vu.update({
      where: { id: taskId },
      data: { trang_thai: "hoan_thanh" },
    });

    // 2. Lấy escrow
    const escrow = await tx.bao_dam_thanh_toan.findFirst({
      where: {
        viec_lam_id: nv.viec_lam_id!,
        sinh_vien_id: nv.sinh_vien_id,
        trang_thai: { in: ["da_nap", "cho_nghiem_thu"] },
      },
    });

    let thucNhan = 0;
    let phiSV = 0;

    if (escrow) {
      const soTien = Number(escrow.so_tien);
      phiSV = isFree ? 0 : Math.round(soTien * 0.03);
      thucNhan = soTien - phiSV;

      // Update escrow → đã giải ngân
      await tx.bao_dam_thanh_toan.update({
        where: { id: escrow.id },
        data: { trang_thai: "da_giai_ngan", ngay_giai_ngan: new Date() },
      });

      // Cộng ví SV
      await tx.vi_tien.upsert({
        where: { sinh_vien_id: nv.sinh_vien_id },
        create: { sinh_vien_id: nv.sinh_vien_id, so_du: thucNhan },
        update: { so_du: { increment: thucNhan } },
      });

      // Ghi giao dịch
      const moTa =
        "Thu nhập từ nghiệm thu: " + nv.ten_nhiem_vu +
        (phiSV > 0 ? ` (đã trừ phí sàn ${phiSV.toLocaleString("vi-VN")}đ)` : "");

      await tx.giao_dich.create({
        data: {
          sinh_vien_id: nv.sinh_vien_id,
          so_tien: thucNhan,
          phi_san: phiSV,
          loai: "thu_nhap",
          mo_ta: moTa,
          trang_thai: "thanh_cong",
        },
      });
    }

    // 3. Update ứng tuyển
    if (nv.viec_lam_id) {
      await tx.ung_tuyen.updateMany({
        where: {
          viec_lam_id: nv.viec_lam_id,
          sinh_vien_id: nv.sinh_vien_id,
        },
        data: { trang_thai: "hoan_thanh" },
      });
    }

    // 4. Thông báo SV
    let thongBao = `Bạn đã nhận ${thucNhan.toLocaleString("vi-VN")}đ từ nghiệm thu: ${nv.ten_nhiem_vu}`;
    if (phiSV > 0) {
      thongBao += `. Phí dịch vụ 3%: ${phiSV.toLocaleString("vi-VN")}đ (đã trừ).`;
    } else {
      const conLai = Math.max(0, 10 - completedCount - 1);
      if (conLai > 0) {
        thongBao += `. Bạn còn ${conLai} đơn miễn phí trước khi áp dụng phí 3%.`;
      }
    }
    if (nhanXet) thongBao += ` Nhận xét: ${nhanXet}`;

    try {
      await tx.thong_bao.create({
        data: {
          sinh_vien_id: nv.sinh_vien_id,
          tieu_de: "✅ Bài nộp đã được nghiệm thu",
          noi_dung: thongBao,
          loai: "success",
        },
      });
    } catch {}
  });

  return { message: "Đã nghiệm thu và giải ngân" };
}