import { Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";

export type SocketRole = "sinh_vien" | "nha_tuyen_dung" | "quan_tri_vien";

export interface AuthedSocket extends Socket {
  userId?: number;
  role?: SocketRole;
}

/**
 * Đọc cookie từ handshake headers, parse ra object đơn giản
 * Không dùng cookie-parser vì socket handshake không có req/res chuẩn
 */
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  cookieHeader.split(";").forEach((part) => {
    const [k, ...v] = part.trim().split("=");
    if (k) out[k] = decodeURIComponent(v.join("="));
  });
  return out;
}

/**
 * Middleware cho Socket.IO
 * - Đọc access token từ cookie theo role
 * - Verify JWT
 * - Gán userId + role vào socket.data
 */
export function socketAuth(socket: AuthedSocket, next: (err?: Error) => void) {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie);

    // Thử lần lượt 3 role — role nào có access_token hợp lệ thì dùng
    const candidates: Array<{ role: SocketRole; key: string }> = [
      { role: "sinh_vien", key: "access_token_sinh_vien" },
      { role: "nha_tuyen_dung", key: "access_token_nha_tuyen_dung" },
      { role: "quan_tri_vien", key: "access_token_quan_tri_vien" },
    ];

    for (const c of candidates) {
      const token = cookies[c.key];
      if (!token) continue;

      try {
        const payload = verifyAccessToken(token);
        // payload: { userId, role }
        if (payload.role !== c.role) continue;

        socket.data.userId = payload.userId;
        socket.data.role = c.role;
        return next();
      } catch {
        // Token hết hạn / sai → thử role kế tiếp
        continue;
      }
    }

    return next(new Error("Không xác thực được"));
  } catch (e) {
    return next(new Error("Lỗi xác thực"));
  }
}