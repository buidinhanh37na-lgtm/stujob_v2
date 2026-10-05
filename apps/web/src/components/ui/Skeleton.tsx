"use client";

export function Skeleton({
  className = "",
  width,
  height,
  rounded = "lg",
}: {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}) {
  const r = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      className={`bg-slate-200 animate-pulse ${r} ${className}`}
      style={{ width, height }}
    />
  );
}

/** List skeleton — dùng cho table/list loading */
export function SkeletonList({
  rows = 5,
  className = "",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100"
        >
          <Skeleton width={40} height={40} rounded="full" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={12} />
          </div>
          <Skeleton width={60} height={24} />
        </div>
      ))}
    </div>
  );
}

/** Card grid skeleton — dùng cho card grids */
export function SkeletonCards({
  count = 4,
  cols = 2,
}: {
  count?: number;
  cols?: 1 | 2 | 3 | 4;
}) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  }[cols];

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton width={44} height={44} rounded="full" />
            <div className="flex-1 space-y-2">
              <Skeleton width="70%" height={14} />
              <Skeleton width="50%" height={12} />
            </div>
          </div>
          <Skeleton width="100%" height={60} />
          <Skeleton width="40%" height={20} />
        </div>
      ))}
    </div>
  );
}