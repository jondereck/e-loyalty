import type { ReactNode } from "react";
import { Sidebar } from "@/components/admin/Sidebar";

export function AdminShell({
  active,
  children,
}: {
  active: string;
  children: ReactNode;
}) {
  return (
    <main className="container section">
      <div className="sidebar-layout">
        <Sidebar active={active} />
        <section>{children}</section>
      </div>
    </main>
  );
}

