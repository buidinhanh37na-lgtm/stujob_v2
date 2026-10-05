import { Server, Socket } from "socket.io";
import { prisma } from "../config/prisma";
import { AuthedSocket } from "./auth";
import { chatRoomKey, userRoomKey, formatMessage } from "./room";

/**
 * Kiểm tra SV và NTD có được chat không
 * (Logic copy từ student/chat.service.ts canChat — không import để tránh circular)
 */
async function canChat(sinhVienId: number, ntdId: number): Promise<boolean> {
  const uts = await prisma.ung_tuyen.findMany({
    where: {
      sinh_vien_id: sinhVienId,
      viec_lam: { nha_tuyen_dung_id: ntdId },
    },
    select: { trang_thai: true },
  });

  if (uts.length === 0) return false;
  if (uts.some((u) => u.trang_thai === "da_chap_nhan")) return true;

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

export function registerChatHandlers(io: Server, socket: AuthedSocket) {
  const userId = socket.data.userId!;
  const role = socket.data.role!;

  // Auto-join room riêng của user (để nhận noti/invite real-time sau này)
  socket.join(userRoomKey(role, userId));

  console.log(`[SOCKET] ${role}#${userId} connected — socketId=${socket.id}`);

  // ============================================================
  // EVENT: join_room — vào phòng chat với 1 người cụ thể
  // Payload: { sinh_vien_id, nha_tuyen_dung_id }
  // ============================================================
  socket.on(
    "join_room",
    async (payload: { sinh_vien_id: number; nha_tuyen_dung_id: number }) => {
      try {
        const { sinh_vien_id, nha_tuyen_dung_id } = payload;

        // Check quyền: role nào cũng phải là 1 trong 2 bên
        if (
          (role === "sinh_vien" && userId !== sinh_vien_id) ||
          (role === "nha_tuyen_dung" && userId !== nha_tuyen_dung_id)
        ) {
          socket.emit("error", { message: "Không có quyền truy cập" });
          return;
        }

        const ok = await canChat(sinh_vien_id, nha_tuyen_dung_id);
        if (!ok) {
          socket.emit("chat_locked", {
            message: "Chat đã bị khóa (nghiệm thu quá 1 ngày)",
          });
          return;
        }

        const room = chatRoomKey(sinh_vien_id, nha_tuyen_dung_id);
        socket.join(room);
        socket.emit("joined", { room });
        console.log(`[SOCKET] ${role}#${userId} joined ${room}`);
      } catch (e) {
        socket.emit("error", { message: "Lỗi join room" });
      }
    }
  );

  // ============================================================
  // EVENT: send_message — gửi tin nhắn
  // Payload: { sinh_vien_id, nha_tuyen_dung_id, noi_dung }
  // ============================================================
  socket.on(
    "send_message",
    async (payload: {
      sinh_vien_id: number;
      nha_tuyen_dung_id: number;
      noi_dung: string;
    }) => {
      try {
        const { sinh_vien_id, nha_tuyen_dung_id, noi_dung } = payload;

        // Validate
        const clean = (noi_dung || "").trim();
        if (!clean || clean.length > 2000) {
          socket.emit("error", { message: "Tin nhắn không hợp lệ" });
          return;
        }

        // Check quyền gửi
        if (
          (role === "sinh_vien" && userId !== sinh_vien_id) ||
          (role === "nha_tuyen_dung" && userId !== nha_tuyen_dung_id)
        ) {
          socket.emit("error", { message: "Không có quyền" });
          return;
        }

        const ok = await canChat(sinh_vien_id, nha_tuyen_dung_id);
        if (!ok) {
          socket.emit("chat_locked", { message: "Chat đã bị khóa" });
          return;
        }

        // Lưu DB
        const created = await prisma.tin_nhan.create({
          data: {
            sinh_vien_id,
            nha_tuyen_dung_id,
            nguoi_gui: role,
            noi_dung: clean,
          },
          select: {
            id: true,
            noi_dung: true,
            nguoi_gui: true,
            created_at: true,
          },
        });

        const room = chatRoomKey(sinh_vien_id, nha_tuyen_dung_id);
        const msg = formatMessage(created);

        // Phát cho cả 2 bên trong room
        io.to(room).emit("new_message", msg);

        // Bonus: đẩy noti vào user room để badge tin chưa đọc realtime
        const otherRoom =
          role === "sinh_vien"
            ? userRoomKey("nha_tuyen_dung", nha_tuyen_dung_id)
            : userRoomKey("sinh_vien", sinh_vien_id);
        io.to(otherRoom).emit("unread_bump", {
          sinh_vien_id,
          nha_tuyen_dung_id,
        });
      } catch (e) {
        socket.emit("error", { message: "Lỗi gửi tin nhắn" });
      }
    }
  );

  // ============================================================
  // EVENT: typing — ai đó đang gõ
  // Payload: { sinh_vien_id, nha_tuyen_dung_id, typing: boolean }
  // ============================================================
  socket.on(
    "typing",
    (payload: {
      sinh_vien_id: number;
      nha_tuyen_dung_id: number;
      typing: boolean;
    }) => {
      const room = chatRoomKey(payload.sinh_vien_id, payload.nha_tuyen_dung_id);
      socket.to(room).emit("user_typing", {
        role,
        userId,
        typing: payload.typing,
      });
    }
  );

  // ============================================================
  // EVENT: read — đánh dấu đã đọc tin
  // Payload: { sinh_vien_id, nha_tuyen_dung_id }
  // ============================================================
  socket.on(
    "read",
    async (payload: { sinh_vien_id: number; nha_tuyen_dung_id: number }) => {
      try {
        const { sinh_vien_id, nha_tuyen_dung_id } = payload;
        // Mình đọc → đánh dấu tin của NGƯỜI KIA gửi cho mình
        const otherSender =
          role === "sinh_vien" ? "nha_tuyen_dung" : "sinh_vien";

        await prisma.tin_nhan.updateMany({
          where: {
            sinh_vien_id,
            nha_tuyen_dung_id,
            nguoi_gui: otherSender,
            da_doc: 0,
          },
          data: { da_doc: 1 },
        });

        const room = chatRoomKey(sinh_vien_id, nha_tuyen_dung_id);
        socket.to(room).emit("messages_read", { by: role, userId });
      } catch (e) {
        socket.emit("error", { message: "Lỗi đánh dấu đã đọc" });
      }
    }
  );

  // ============================================================
  // DISCONNECT
  // ============================================================
  socket.on("disconnect", () => {
    console.log(`[SOCKET] ${role}#${userId} disconnected — socketId=${socket.id}`);
  });
}