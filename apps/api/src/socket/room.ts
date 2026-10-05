/**
 * Room key cho 1 cuộc trò chuyện giữa SV và NTD
 * Cả 2 bên join cùng room này để nhận tin của nhau
 */
export function chatRoomKey(sinhVienId: number, ntdId: number): string {
  return `chat:sv_${sinhVienId}:ntd_${ntdId}`;
}

/**
 * Room riêng cho mỗi user — dùng để push notification vào mọi tab đang mở
 */
export function userRoomKey(role: string, userId: number): string {
  return `user:${role}:${userId}`;
}

/**
 * Format tin nhắn trước khi emit (giống shape của API listMessages)
 */
export function formatMessage(m: {
  id: number;
  noi_dung: string;
  nguoi_gui: string;
  created_at: Date | string | null;
}) {
  let created_at: string;
  if (m.created_at == null) {
    created_at = new Date().toISOString();
  } else if (m.created_at instanceof Date) {
    created_at = m.created_at.toISOString();
  } else {
    created_at = m.created_at;
  }

  return {
    id: m.id,
    noi_dung: m.noi_dung,
    nguoi_gui: m.nguoi_gui,
    created_at,
  };
}