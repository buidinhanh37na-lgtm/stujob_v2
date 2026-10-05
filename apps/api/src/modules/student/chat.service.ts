import { prisma } from "../../config/prisma";

// ============================================================
// Kiểm tra SV có được chat với NTD không
// - Đang làm việc (da_chap_nhan) → OK
// - Vừa nghiệm thu (hoan_thanh) trong 1 ngày → OK
// - Quá 1 ngày → khóa
// ============================================================
export async function canChat(sinhVienId: number, ntdId: number) {
  const uts = await prisma.ung_tuyen.findMany({
    where: {
      sinh_vien_id: sinhVienId,
      viec_lam: { nha_tuyen_dung_id: ntdId },
    },
    select: {
      id: true,
      trang_thai: true,
      viec_lam_id: true,
    },
  });

  if (uts.length === 0) return false;

  // Check da_chap_nhan
  if (uts.some((u) => u.trang_thai === "da_chap_nhan")) return true;

  // Check hoan_thanh trong 1 ngày
  const done = uts.filter((u) => u.trang_thai === "hoan_thanh");
  if (done.length > 0) {
    const escrow = await prisma.bao_dam_thanh_toan.findFirst({
      where: {
        sinh_vien_id: sinhVienId,
        nha_tuyen_dung_id: ntdId,
        trang_thai: "da_giai_ngan",
      },
      orderBy: { ngay_giai_ngan: "desc" },
      select: { ngay_giai_ngan: true },
    });

    if (escrow?.ngay_giai_ngan) {
      const diff = Date.now() - new Date(escrow.ngay_giai_ngan).getTime();
      if (diff <= 24 * 60 * 60 * 1000) return true;
    }
  }

  return false;
}

// ============================================================
// Lấy danh sách NTD có thể chat + preview tin cuối
// ============================================================
export async function listPartners(sinhVienId: number) {
  // Lấy tất cả NTD có ung_tuyen da_chap_nhan hoặc vừa hoan_thanh
  const uts = await prisma.ung_tuyen.findMany({
    where: {
      sinh_vien_id: sinhVienId,
      trang_thai: { in: ["da_chap_nhan", "hoan_thanh"] },
    },
    include: {
      viec_lam: {
        select: {
          nha_tuyen_dung_id: true,
          nha_tuyen_dung: {
            select: { id: true, ten_cong_ty: true, logo: true },
          },
        },
      },
    },
  });

  // Unique NTD
  const ntdMap = new Map<number, { id: number; ten_cong_ty: string; logo: string | null }>();
  for (const u of uts) {
    const ntd = (u.viec_lam as any)?.nha_tuyen_dung;
    if (ntd && !ntdMap.has(ntd.id)) {
      ntdMap.set(ntd.id, ntd);
    }
  }

  // Với mỗi NTD, lấy tin cuối + số chưa đọc
  const result = [];
  for (const ntd of ntdMap.values()) {
    // Check can_chat
    const ok = await canChat(sinhVienId, ntd.id);
    if (!ok) continue;

    const [lastMsg, unreadCount] = await Promise.all([
      prisma.tin_nhan.findFirst({
        where: { sinh_vien_id: sinhVienId, nha_tuyen_dung_id: ntd.id },
        orderBy: { id: "desc" },
        select: { noi_dung: true, created_at: true },
      }),
      prisma.tin_nhan.count({
        where: {
          sinh_vien_id: sinhVienId,
          nha_tuyen_dung_id: ntd.id,
          nguoi_gui: "nha_tuyen_dung",
          da_doc: 0,
        },
      }),
    ]);

    result.push({
      id: ntd.id,
      ten_cong_ty: ntd.ten_cong_ty,
      logo: ntd.logo,
      tin_cuoi: lastMsg?.noi_dung || null,
      thoi_gian: lastMsg?.created_at || null,
      chua_doc: unreadCount,
    });
  }

  // Sort: có tin nhắn mới lên đầu
  result.sort((a, b) => {
    const ta = a.thoi_gian ? new Date(a.thoi_gian).getTime() : 0;
    const tb = b.thoi_gian ? new Date(b.thoi_gian).getTime() : 0;
    return tb - ta;
  });

  return { items: result };
}

// ============================================================
// Lấy tin nhắn giữa SV và 1 NTD
// ============================================================
export async function listMessages(sinhVienId: number, ntdId: number) {
  const ok = await canChat(sinhVienId, ntdId);
  if (!ok) {
    return {
      locked: true,
      message:
        "Chat đã bị khóa. Công việc đã nghiệm thu quá 1 ngày. Vui lòng chờ lời mời mới từ nhà tuyển dụng.",
      items: [],
    };
  }

  const items = await prisma.tin_nhan.findMany({
    where: { sinh_vien_id: sinhVienId, nha_tuyen_dung_id: ntdId },
    orderBy: { id: "asc" },
    take: 200,
    select: {
      id: true,
      noi_dung: true,
      nguoi_gui: true,
      created_at: true,
    },
  });

  // Mark as read
  await prisma.tin_nhan.updateMany({
    where: {
      sinh_vien_id: sinhVienId,
      nha_tuyen_dung_id: ntdId,
      nguoi_gui: "nha_tuyen_dung",
      da_doc: 0,
    },
    data: { da_doc: 1 },
  });

  return { locked: false, items };
}

// ============================================================
// Gửi tin nhắn
// ============================================================
export async function sendMessage(
  sinhVienId: number,
  ntdId: number,
  content: string
) {
  const ok = await canChat(sinhVienId, ntdId);
  if (!ok)
    throw { status: 403, message: "Chat đã bị khóa" };

  const clean = content.trim();
  if (!clean) throw { status: 400, message: "Tin nhắn rỗng" };
  if (clean.length > 2000)
    throw { status: 400, message: "Tin nhắn quá dài (tối đa 2000 ký tự)" };

  const msg = await prisma.tin_nhan.create({
    data: {
      sinh_vien_id: sinhVienId,
      nha_tuyen_dung_id: ntdId,
      nguoi_gui: "sinh_vien",
      noi_dung: clean,
    },
    select: { id: true, created_at: true },
  });

  return { id: msg.id, created_at: msg.created_at };
}

// ============================================================
// Đếm tổng tin chưa đọc (cho badge)
// ============================================================
export async function countUnread(sinhVienId: number) {
  const count = await prisma.tin_nhan.count({
    where: {
      sinh_vien_id: sinhVienId,
      nguoi_gui: "nha_tuyen_dung",
      da_doc: 0,
    },
  });
  return { count };
}