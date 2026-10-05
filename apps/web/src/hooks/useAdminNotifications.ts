"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";

const POLL_INTERVAL = 30_000;

export function useAdminNotifications() {
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/notifications/count");
      if (data.success) setUnread(data.count || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(() => {
      if (!document.hidden) refresh();
    }, POLL_INTERVAL);
    return () => clearInterval(t);
  }, [refresh]);

  return { unread, loading, refresh };
}