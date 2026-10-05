"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";

type Role = "sinh_vien" | "nha_tuyen_dung" | "quan_tri_vien";

interface BadgeMap {
  [href: string]: number;
}

const POLL_INTERVAL = 30_000;

/**
 * Fetch số lượng badges cho sidebar theo role
 * - SV: lời mời, thông báo
 * - NTD: ứng tuyển chờ, tin nhắn chưa đọc, thông báo
 * - Admin: SV chờ xác thực, khiếu nại chờ, thông báo
 */
export function useSidebarBadges(role: Role): BadgeMap {
  const [badges, setBadges] = useState<BadgeMap>({});

  const fetchBadges = useCallback(async () => {
    try {
      const next: BadgeMap = {};

      if (role === "sinh_vien") {
        const [inv, noti] = await Promise.allSettled([
          api.get("/api/student/invitations/count"),
          api.get("/api/student/notifications/count"),
        ]);

        if (inv.status === "fulfilled" && inv.value.data.success) {
          next["/student/invitations"] = inv.value.data.count || 0;
        }
        if (noti.status === "fulfilled" && noti.value.data.success) {
          next["/student/notifications"] = noti.value.data.count || 0;
        }
      } else if (role === "nha_tuyen_dung") {
        const [dash, msg, noti] = await Promise.allSettled([
          api.get("/api/employer/dashboard"),
          api.get("/api/employer/messages/count"),
          api.get("/api/employer/notifications/count"),
        ]);

        if (dash.status === "fulfilled" && dash.value.data.success) {
          next["/employer/applications"] =
            dash.value.data.stats?.pending_apps || 0;
        }
        if (msg.status === "fulfilled" && msg.value.data.success) {
          next["/employer/chat"] = msg.value.data.count || 0;
        }
        if (noti.status === "fulfilled" && noti.value.data.success) {
          next["/employer/notifications"] = noti.value.data.count || 0;
        }
      } else if (role === "quan_tri_vien") {
        const [dash, noti] = await Promise.allSettled([
          api.get("/api/admin/dashboard"),
          api.get("/api/admin/notifications/count"),
        ]);

        if (dash.status === "fulfilled" && dash.value.data.success) {
          const o = dash.value.data.overview || {};
          next["/admin/verify"] = o.pending_verify || 0;
          next["/admin/complaints"] = o.pending_complaints || 0;
        }
        if (noti.status === "fulfilled" && noti.value.data.success) {
          next["/admin/notifications"] = noti.value.data.count || 0;
        }
      }

      setBadges(next);
    } catch {
      // silent — badge không quan trọng, không cần toast
    }
  }, [role]);

  useEffect(() => {
    fetchBadges();
    const t = setInterval(() => {
      if (!document.hidden) fetchBadges();
    }, POLL_INTERVAL);
    return () => clearInterval(t);
  }, [fetchBadges]);

  return badges;
}