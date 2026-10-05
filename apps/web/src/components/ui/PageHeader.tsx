"use client";

import { ReactNode } from "react";

export interface PageHeaderProps {
  icon?: ReactNode | string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({
  icon,
  title,
  subtitle,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
      <div className="min-w-0">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          {icon && (
            <span className="flex-shrink-0">
              {typeof icon === "string" ? icon : icon}
            </span>
          )}
          <span className="truncate">{title}</span>
        </h2>
        {subtitle && (
          <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}