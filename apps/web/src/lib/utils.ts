import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtMoney(n: number | string | null | undefined): string {
  const num = Math.round(Number(n || 0));
  return num.toLocaleString("vi-VN") + "₫";
}

export function fmtDate(s: string | Date | null | undefined): string {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN");
}

export function fmtDateTime(s: string | Date | null | undefined): string {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function thuName(n: number): string {
  const map: Record<number, string> = {
    2: "Thứ 2",
    3: "Thứ 3",
    4: "Thứ 4",
    5: "Thứ 5",
    6: "Thứ 6",
    7: "Thứ 7",
    8: "Chủ nhật",
  };
  return map[n] || "";
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

// apps/web/src/lib/utils.ts

/**
 * Format thời gian dạng "5 phút trước", "2 giờ trước"...
 */
export function fmtTimeAgo(s: string | Date | null | undefined): string {
  if (!s) return "";
  const diff = (Date.now() - new Date(s).getTime()) / 1000;

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;

  return new Date(s).toLocaleDateString("vi-VN");
}