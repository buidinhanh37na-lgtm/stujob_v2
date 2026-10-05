"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/axios";
import { useSocket } from "@/providers/SocketProvider";

export interface ChatMessage {
  id: number;
  noi_dung: string;
  nguoi_gui: string; // "sinh_vien" | "nha_tuyen_dung"
  created_at: string;
}

interface UseChatOptions {
  sinhVienId: number | null;
  nhaTuyenDungId: number | null;
  /** Role hiện tại: "sinh_vien" | "nha_tuyen_dung" */
  myRole: "sinh_vien" | "nha_tuyen_dung";
  /** Bật polling qua REST API khi socket không khả dụng */
  fallbackRest?: boolean;
}

interface UseChatResult {
  messages: ChatMessage[];
  loading: boolean;
  locked: boolean;
  lockedMessage: string | null;
  typingFrom: "sinh_vien" | "nha_tuyen_dung" | null;
  connected: boolean;
  sendMessage: (content: string) => Promise<boolean>;
  emitTyping: (typing: boolean) => void;
  markRead: () => void;
  reload: () => Promise<void>;
}

export function useChat({
  sinhVienId,
  nhaTuyenDungId,
  myRole,
  fallbackRest = true,
}: UseChatOptions): UseChatResult {
  const { socket, connected } = useSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [typingFrom, setTypingFrom] = useState<
    "sinh_vien" | "nha_tuyen_dung" | null
  >(null);

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ============================================================
  // Load tin nhắn ban đầu qua REST
  // ============================================================
  const reload = useCallback(async () => {
    if (!sinhVienId || !nhaTuyenDungId) return;

    setLoading(true);
    try {
      // SV dùng /api/student/chat/:ntdId
      // NTD dùng /api/employer/messages/:svId
      const url =
        myRole === "sinh_vien"
          ? `/api/student/chat/${nhaTuyenDungId}`
          : `/api/employer/messages/${sinhVienId}`;

      const { data } = await api.get(url);

      if (data.locked) {
        setLocked(true);
        setLockedMessage(data.message || "Chat đã bị khóa");
        setMessages([]);
        return;
      }

      setLocked(false);
      setLockedMessage(null);
      setMessages(data.items || data.messages || []);
    } catch (e) {
      console.error("[useChat] reload error", e);
    } finally {
      setLoading(false);
    }
  }, [sinhVienId, nhaTuyenDungId, myRole]);

  // Load lần đầu / khi đổi partner
  useEffect(() => {
    reload();
  }, [reload]);

  // ============================================================
  // Socket: join room + lắng nghe events
  // ============================================================
  useEffect(() => {
    if (!socket || !sinhVienId || !nhaTuyenDungId) return;

    // Emit join_room khi socket connected
    const join = () => {
      socket.emit("join_room", {
        sinh_vien_id: sinhVienId,
        nha_tuyen_dung_id: nhaTuyenDungId,
      });
    };

    if (socket.connected) join();
    socket.on("connect", join);

    // -------- Handlers --------
    const onJoined = (d: { room: string }) => {
      console.log("[useChat] joined", d.room);
    };

    const onNewMessage = (m: ChatMessage) => {
      setMessages((prev) => {
        // Tránh trùng id (nếu đã optimistic ở sendMessage)
        if (prev.some((x) => x.id === m.id)) return prev;
        return [...prev, m];
      });
    };

    const onLocked = (d: { message: string }) => {
      setLocked(true);
      setLockedMessage(d.message);
    };

    const onTyping = (d: {
      role: string;
      userId: number;
      typing: boolean;
    }) => {
      // Chỉ hiện typing của NGƯỜI KIA
      if (d.role === myRole) return;
      if (d.typing) {
        setTypingFrom(d.role as "sinh_vien" | "nha_tuyen_dung");
      } else {
        setTypingFrom(null);
      }
    };

    const onRead = () => {
      // Có thể cập nhật UI tick xanh — bỏ qua cho đơn giản
    };

    const onError = (e: { message: string }) => {
      console.warn("[useChat] socket error:", e.message);
    };

    socket.on("joined", onJoined);
    socket.on("new_message", onNewMessage);
    socket.on("chat_locked", onLocked);
    socket.on("user_typing", onTyping);
    socket.on("messages_read", onRead);
    socket.on("error", onError);

    return () => {
      socket.off("connect", join);
      socket.off("joined", onJoined);
      socket.off("new_message", onNewMessage);
      socket.off("chat_locked", onLocked);
      socket.off("user_typing", onTyping);
      socket.off("messages_read", onRead);
      socket.off("error", onError);
    };
  }, [socket, sinhVienId, nhaTuyenDungId, myRole]);

  // ============================================================
  // Fallback REST polling nếu socket disconnected
  // ============================================================
  useEffect(() => {
    if (!fallbackRest) return;
    if (connected) return; // socket OK → không cần poll
    if (locked) return;

    const t = setInterval(() => {
      reload();
    }, 15000); // 15s

    return () => clearInterval(t);
  }, [connected, fallbackRest, locked, reload]);

  // ============================================================
  // Mark read khi vào chat
  // ============================================================
  useEffect(() => {
    if (!socket || !sinhVienId || !nhaTuyenDungId || locked) return;
    if (!connected) return;

    socket.emit("read", {
      sinh_vien_id: sinhVienId,
      nha_tuyen_dung_id: nhaTuyenDungId,
    });
  }, [socket, sinhVienId, nhaTuyenDungId, connected, locked]);

  // ============================================================
  // API: gửi tin
  // ============================================================
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const clean = content.trim();
      if (!clean) return false;

      if (!socket || !sinhVienId || !nhaTuyenDungId) return false;

      // Ưu tiên socket
      if (connected) {
        socket.emit("send_message", {
          sinh_vien_id: sinhVienId,
          nha_tuyen_dung_id: nhaTuyenDungId,
          noi_dung: clean,
        });
        return true;
      }

      // Fallback REST
      try {
        const url =
          myRole === "sinh_vien"
            ? `/api/student/chat/${nhaTuyenDungId}`
            : `/api/employer/messages/${sinhVienId}`;
        await api.post(url, { noi_dung: clean });
        await reload();
        return true;
      } catch (e) {
        console.error("[useChat] send REST error", e);
        return false;
      }
    },
    [socket, connected, sinhVienId, nhaTuyenDungId, myRole, reload]
  );

  // ============================================================
  // Typing emit + debounce auto off
  // ============================================================
  const emitTyping = useCallback(
    (typing: boolean) => {
      if (!socket || !connected) return;
      if (!sinhVienId || !nhaTuyenDungId) return;

      socket.emit("typing", {
        sinh_vien_id: sinhVienId,
        nha_tuyen_dung_id: nhaTuyenDungId,
        typing,
      });

      if (typing) {
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {
          socket.emit("typing", {
            sinh_vien_id: sinhVienId,
            nha_tuyen_dung_id: nhaTuyenDungId,
            typing: false,
          });
        }, 3000);
      }
    },
    [socket, connected, sinhVienId, nhaTuyenDungId]
  );

  // ============================================================
  // Mark read thủ công
  // ============================================================
  const markRead = useCallback(() => {
    if (!socket || !connected) return;
    if (!sinhVienId || !nhaTuyenDungId) return;
    socket.emit("read", {
      sinh_vien_id: sinhVienId,
      nha_tuyen_dung_id: nhaTuyenDungId,
    });
  }, [socket, connected, sinhVienId, nhaTuyenDungId]);

  return {
    messages,
    loading,
    locked,
    lockedMessage,
    typingFrom,
    connected,
    sendMessage,
    emitTyping,
    markRead,
    reload,
  };
}