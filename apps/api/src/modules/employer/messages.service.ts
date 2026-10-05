import { prisma } from "../../config/prisma";

// ============================================================
// Check NTD có thể chat với SV không
// ============================================================
export async function canChat(ntdId: number, svId: number) {
  const uts = await prisma.ung_tuyen.findMany({
    where: {
      sinh_vien_id: svId,
      viec_lam: { nha_tuyen_dung_id: ntdId },
    },
    select: { id: true, trang_thai: true },
  });

  if (uts.length === 0) return false;

  // da_chap_nhan → OK
  if (uts.some((u) => u.trang_thai === "da_chap_nhan")) return true;

  // hoan_thanh trong 1 ngày
  if (uts.some((u) => u.trang_thai === "hoan_thanh")) {
    const escrow = await prisma.bao_dam_thanh_toan.findFirst({
      where: {
        nha_tuyen_dung_id: ntdId,
        sinh_vien_id: svId,
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
// List partners (SV có thể chat)
// ============================================================
export async function listConversations(ntdId: number) {
  // Lấy SV đã tương tác (da_chap_nhan hoặc hoan_thanh)
  const uts = await prisma.ung_tuyen.findMany({
    where: {
      viec_lam: { nha_tuyen_dung_id: ntdId },
      trang_thai: { in: ["da_chap_nhan", "hoan_thanh"] },
    },
    select: { sinh_vien_id: true },
  });

  const svIds = [...new Set(uts.map((u) => u.sinh_vien_id))];

  // Lấy SV info
  const svList = svIds.length
    ? await prisma.sinh_vien.findMany({
        where: { id: { in: svIds } },
        select: { id: true, ho_ten: true, ma_sinh_vien: true, anh_dai_dien: true },
      })
    : [];

  const svMap = new Map(svList.map((s) => [s.id, s]));

  const result = [];
  for (const svId of svIds) {
    const ok = await canChat(ntdId, svId);
    if (!ok) continue;

    const [lastMsg, unreadCount] = await Promise.all([
      prisma.tin_nhan.findFirst({
        where: { nha_tuyen_dung_id: ntdId, sinh_vien_id: svId },
        orderBy: { id: "desc" },
        select: { noi_dung: true, created_at: true },
      }),
      prisma.tin_nhan.count({
        where: {
          nha_tuyen_dung_id: ntdId,
          sinh_vien_id: svId,
          nguoi_gui: "sinh_vien",
          da_doc: 0,
        },
      }),
    ]);

    const sv = svMap.get(svId);
    result.push({
      sinh_vien_id: svId,
      ho_ten: sv?.ho_ten || "",
      ma_sinh_vien: sv?.ma_sinh_vien || "",
      anh_dai_dien: sv?.anh_dai_dien || null,
      tin_cuoi: lastMsg?.noi_dung || null,
      thoi_gian: lastMsg?.created_at || null,
      chua_doc: unreadCount,
    });
  }

  result.sort((a, b) => {
    const ta = a.thoi_gian ? new Date(a.thoi_gian).getTime() : 0;
    const tb = b.thoi_gian ? new Date(b.thoi_gian).getTime() : 0;
    return tb - ta;
  });

  return { items: result };
}

// ============================================================
// List messages với 1 SV
// ============================================================
export async function listMessages(ntdId: number, svId: number) {
  const ok = await canChat(ntdId, svId);
  if (!ok) {
    return {
      locked: true,
      message:
        "Chat đã bị khóa. Công việc đã nghiệm thu quá 1 ngày. Vui lòng mời SV làm việc mới nếu muốn tiếp tục liên lạc.",
      items: [],
    };
  }

  const items = await prisma.tin_nhan.findMany({
    where: { nha_tuyen_dung_id: ntdId, sinh_vien_id: svId },
    orderBy: { id: "asc" },
    take: 200,
    select: { id: true, noi_dung: true, nguoi_gui: true, created_at: true },
  });

  // Mark read
  await prisma.tin_nhan.updateMany({
    where: {
      nha_tuyen_dung_id: ntdId,
      sinh_vien_id: svId,
      nguoi_gui: "sinh_vien",
      da_doc: 0,
    },
    data: { da_doc: 1 },
  });

  return { locked: false, items };
}

// ============================================================
// Send message
// ============================================================
export async function sendMessage(ntdId: number, svId: number, content: string) {
  const ok = await canChat(ntdId, svId);
  if (!ok) throw { status: 403, message: "Chat đã bị khóa" };

  const clean = content.trim();
  if (!clean) throw { status: 400, message: "Tin nhắn rỗng" };
  if (clean.length > 2000) throw { status: 400, message: "Tin nhắn quá dài" };

  const msg = await prisma.tin_nhan.create({
    data: {
      sinh_vien_id: svId,
      nha_tuyen_dung_id: ntdId,
      nguoi_gui: "nha_tuyen_dung",
      noi_dung: clean,
    },
    select: { id: true, created_at: true },
  });

  return { id: msg.id, created_at: msg.created_at };
}

// ============================================================
// Đếm unread tổng
// ============================================================
export async function countUnread(ntdId: number) {
  const count = await prisma.tin_nhan.count({
    where: {
      nha_tuyen_dung_id: ntdId,
      nguoi_gui: "sinh_vien",
      da_doc: 0,
    },
  });
  return { count };
}