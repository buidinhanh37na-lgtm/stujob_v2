"use client";

import { Sidebar, SidebarItem } from "./Sidebar";
import { Topbar } from "./Topbar";

type Role = "sinh_vien" | "nha_tuyen_dung" | "quan_tri_vien";

interface Props {
  role: Role;
  items: SidebarItem[];
  title: string;
  children: React.ReactNode;
}

export function DashboardLayout({ role, items, title, children }: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role={role} items={items} pageTitle={title} />
      <div className="lg:pl-64">
        <Topbar role={role} title={title} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}