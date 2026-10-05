"use client";

import { useAdminNotifications } from "@/hooks/useAdminNotifications";

interface Props {
  variant?: "dot" | "count";
}

export function NotificationBadge({ variant = "count" }: Props) {
  const { unread } = useAdminNotifications();

  if (!unread) return null;

  if (variant === "dot") {
    return (
      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
    );
  }

  return (
    <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
      {unread > 99 ? "99+" : unread}
    </span>
  );
}