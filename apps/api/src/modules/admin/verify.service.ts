import { prisma } from "../../config/prisma";
import { logAdmin } from "./_helpers";

// ============================================================
// List yêu cầu xác thực
// ============================================================
export async function listRequests(status: string, q: string) {
  const where: any = {};
  if (status !== "all") where.trang_thai = status;

  const items = await prisma.yeu_cau_xac_thuc.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: 200,
  });

  // Lookup SV
  const svIds = items.map((i) => i.sinh_vien_id);
  const svList = svIds.length
    ? await prisma.sinh_vien.findMany({
        where: { id: { in: svIds } },
        select: {
          id: true,
          ma_sinh_vien: true,
          ho_ten: true,
          email: true,
          truong: true,
          chuyen_nganh: true,
          nam_hoc: true,
          anh_dai_dien: true,
        },
      })
    : [];

  const svMap = new Map(svList.map((s) => [s.id, s]));

  let mapped = items.map((i) => {
    const sv = svMap.get(i.sinh_vien_id);
    return {
      id: i.id,
      sinh_vien_id: i.sinh_vien_id,
      trang_thai: i.trang_thai,
      ghi_chu: i.ghi_chu,
      ly_do_tu_choi: i.ly_do_tu_choi,
      created_at: i.created_at,
      processed_at: i.processed_at,
      ma_sinh_vien: sv?.ma_sinh_vien || "",
      ho_ten: sv?.ho_ten || "",
      email: sv?.email || "",
      truong: sv?.truong || "",
      chuyen_nganh: sv?.chuyen_nganh || "",
      nam_hoc: sv?.nam_hoc || null,
      anh_dai_dien: sv?.anh_dai_dien || null,
    };
  });

  // Filter search
  if (q) {
    const lower = q.toLowerCase();
    mapped = mapped.filter(
      (m) =>
        m.ma_sinh_vien.toLowerCase().includes(lower) ||
        m.ho_ten.toLowerCase().includes(lower) ||
        m.email.toLowerCase().includes(lower)
    );
  }

  return { items: mapped };
}

// ============================================================
// Chi tiết + so khớp với DB nhà trường
// ============================================================
export async function getRequestDetail(id: number) {
  const yc = await prisma.yeu_cau_xac_thuc.findUnique({
    where: { id },
    include: {
      // Không có relation, lookup riêng
    },
  });
  if (!yc) throw { status: 404, message: "Không tìm thấy" };

  const sv = await prisma.sinh_vien.findUnique({
    where: { id: yc.sinh_vien_id },
    select: {
      id: true,
      ma_sinh_vien: true,
      ho_ten: true,
      email: true,
      so_dien_thoai: true,
      truong: true,
      khoa: true,
      chuyen_nganh: true,
      nam_hoc: true,
      gpa: true,
      trang_thai_xac_thuc: true,
      created_at: true,
    },
  });
  if (!sv) throw { status: 404, message: "Không tìm thấy SV" };

  // Lookup DB nhà trường
  const nhaTruong = await prisma.sv_truong.findUnique({
    where: { ma_sinh_vien: sv.ma_sinh_vien },
    select: {
      ma_sinh_vien: true,
      ho_ten: true,
      ngay_sinh: true,
      khoa: true,
      chuyen_nganh: true,
      nam_hoc: true,
      lop: true,
      trang_thai: true,
    },
  });

  let compare: any = null;
  if (nhaTruong) {
    compare = {
      ho_ten: {
        he_thong: sv.ho_ten,
        nha_truong: nhaTruong.ho_ten,
        khop:
          sv.ho_ten.trim().toLowerCase() ===
          nhaTruong.ho_ten.trim().toLowerCase(),
      },
      chuyen_nganh: {
        he_thong: sv.chuyen_nganh,
        nha_truong: nhaTruong.chuyen_nganh,
        khop:
          (sv.chuyen_nganh || "").trim().toLowerCase() ===
          (nhaTruong.chuyen_nganh || "").trim().toLowerCase(),
      },
      nam_hoc: {
        he_thong: sv.nam_hoc,
        nha_truong: nhaTruong.nam_hoc,
        khop: (sv.nam_hoc || 0) === (nhaTruong.nam_hoc || 0),
      },
      trang_thai_truong: nhaTruong.trang_thai,
    };
  }

  return { yeu_cau: { ...yc, sinh_vien: sv }, nha_truong: nhaTruong, so_khop: compare };
}

// ============================================================
// Duyệt 1 yêu cầu
// ============================================================
export async function approveRequest(
  adminId: number,
  id: number,
  ghiChu: string
) {
  const yc = await prisma.yeu_cau_xac_thuc.findUnique({
    where: { id },
    select: { id: true, sinh_vien_id: true },
  });
  if (!yc) throw { status: 404, message: "Không tìm thấy" };

  await prisma.$transaction(async (tx) => {
    await tx.yeu_cau_xac_thuc.update({
      where: { id },
      data: {
        trang_thai: "da_xac_thuc",
        admin_id: adminId,
        processed_at: new Date(),
        ghi_chu: ghiChu || null,
      },
    });

    await tx.sinh_vien.update({
      where: { id: yc.sinh_vien_id },
      data: { trang_thai_xac_thuc: "da_xac_thuc" },
    });

    try {
      await tx.thong_bao.create({
        data: {
          sinh_vien_id: yc.sinh_vien_id,
          tieu_de: "✅ Xác thực thành công",
          noi_dung:
            "Tài khoản sinh viên của bạn đã được xác thực. Bạn có thể ứng tuyển mọi công việc.",
          loai: "success",
        },
      });
    } catch {}
  });

  await logAdmin(
    adminId,
    "approve_verify",
    "sinh_vien",
    yc.sinh_vien_id,
    ghiChu || null
  );

  return { message: "Đã xác thực sinh viên" };
}

// ============================================================
// Từ chối
// ============================================================
export async function rejectRequest(
  adminId: number,
  id: number,
  lyDo: string
) {
  if (!lyDo) throw { status: 400, message: "Vui lòng nhập lý do" };

  const yc = await prisma.yeu_cau_xac_thuc.findUnique({
    where: { id },
    select: { id: true, sinh_vien_id: true },
  });
  if (!yc) throw { status: 404, message: "Không tìm thấy" };

  await prisma.$transaction(async (tx) => {
    await tx.yeu_cau_xac_thuc.update({
      where: { id },
      data: {
        trang_thai: "tu_choi",
        admin_id: adminId,
        processed_at: new Date(),
        ly_do_tu_choi: lyDo,
      },
    });

    try {
      await tx.thong_bao.create({
        data: {
          sinh_vien_id: yc.sinh_vien_id,
          tieu_de: "❌ Xác thực bị từ chối",
          noi_dung: `Lý do: ${lyDo}`,
          loai: "error",
        },
      });
    } catch {}
  });

  await logAdmin(
    adminId,
    "reject_verify",
    "sinh_vien",
    yc.sinh_vien_id,
    lyDo
  );

  return { message: "Đã từ chối xác thực" };
}

// ============================================================
// Tự động xác thực hàng loạt
// ============================================================
export async function autoVerifyBatch(adminId: number) {
  const requests = await prisma.yeu_cau_xac_thuc.findMany({
    where: { trang_thai: "cho_duyet" },
    select: { id: true, sinh_vien_id: true },
  });

  // Lookup SV
  const svIds = requests.map((r) => r.sinh_vien_id);
  const svList = svIds.length
    ? await prisma.sinh_vien.findMany({
        where: { id: { in: svIds } },
        select: { id: true, ma_sinh_vien: true },
      })
    : [];
  const svMap = new Map(svList.map((s) => [s.id, s]));

  let success = 0;
  let failed = 0;

  for (const r of requests) {
    const sv = svMap.get(r.sinh_vien_id);
    if (!sv) {
      failed++;
      continue;
    }

    const nhaTruong = await prisma.sv_truong.findUnique({
      where: { ma_sinh_vien: sv.ma_sinh_vien },
      select: { trang_thai: true },
    });

    if (nhaTruong && nhaTruong.trang_thai === "dang_hoc") {
      await prisma.yeu_cau_xac_thuc.update({
        where: { id: r.id },
        data: {
          trang_thai: "da_xac_thuc",
          admin_id: adminId,
          processed_at: new Date(),
          ghi_chu: "Tự động xác thực (khớp DB trường)",
        },
      });
      await prisma.sinh_vien.update({
        where: { id: r.sinh_vien_id },
        data: { trang_thai_xac_thuc: "da_xac_thuc" },
      });
      try {
        await prisma.thong_bao.create({
          data: {
            sinh_vien_id: r.sinh_vien_id,
            tieu_de: "✅ Xác thực thành công",
            noi_dung: "Tài khoản của bạn đã được xác thực tự động.",
            loai: "success",
          },
        });
      } catch {}
      success++;
    } else {
      failed++;
    }
  }

  await logAdmin(
    adminId,
    "auto_verify_batch",
    null,
    null,
    `Duyệt tự động: ${success} thành công, ${failed} thất bại`
  );

  return {
    message: `Đã xử lý ${requests.length} yêu cầu. Thành công: ${success}, Thất bại: ${failed}`,
    success,
    failed,
  };
}

// ============================================================
// Stats
// ============================================================
export async function getStats() {
  const [cho, da, tu] = await Promise.all([
    prisma.yeu_cau_xac_thuc.count({ where: { trang_thai: "cho_duyet" } }),
    prisma.yeu_cau_xac_thuc.count({ where: { trang_thai: "da_xac_thuc" } }),
    prisma.yeu_cau_xac_thuc.count({ where: { trang_thai: "tu_choi" } }),
  ]);
  return {
    yeu_cau: {
      cho_duyet: cho,
      da_xac_thuc: da,
      tu_choi: tu,
    },
  };
}