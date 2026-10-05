"use client";

import { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode | string;
  title: string;
  description?: string;
  action?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZE = {
  sm: { wrap: "py-8", icon: "text-4xl", title: "text-sm", desc: "text-xs" },
  md: { wrap: "py-12", icon: "text-5xl", title: "text-base", desc: "text-sm" },
  lg: { wrap: "py-16", icon: "text-6xl", title: "text-lg", desc: "text-sm" },
};

export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
  size = "md",
}: EmptyStateProps) {
  const s = SIZE[size];
  return (
    <div className={`text-center ${s.wrap}`}>
      <div className={`${s.icon} opacity-40 mb-3`}>
        {typeof icon === "string" ? icon : icon}
      </div>
      <p className={`font-semibold text-slate-600 ${s.title}`}>{title}</p>
      {description && (
        <p className={`text-slate-400 mt-1 ${s.desc}`}>{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}