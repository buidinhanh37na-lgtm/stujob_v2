"use client";

import { useMemo } from "react";
import { Sidebar, SidebarItem } from "./Sidebar";
import { Topbar } from "./Topbar";
import { PageTransition } from "@/components/motion";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";

type Role = "sinh_vien" | "nha_tuyen_dung" | "quan_tri_vien";

interface Props {
  role: Role;
  items: SidebarItem[];
  title: string;
  children: React.ReactNode;
}

export function DashboardLayout({ role, items, title, children }: Props) {
  const badges = useSidebarBadges(role);

  // Merge badge từ hook vào items
  const itemsWithBadges = useMemo(
    () =>
      items.map((it) => ({
        ...it,
        badge: badges[it.href] ?? it.badge,
      })),
    [items, badges]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role={role} items={itemsWithBadges} pageTitle={title} />
      <div className="lg:pl-64">
        <Topbar role={role} title={title} />
        <main className="p-4 sm:p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}