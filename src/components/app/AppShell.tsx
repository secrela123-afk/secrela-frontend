"use client";

import type { ReactNode } from "react";
import { useUiStore } from "../../stores/ui-store";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";
import { PermissionRouteGate } from "./PermissionRouteGate";
import { TrialBanner } from "./TrialBanner";

export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <div className="flex h-screen overflow-hidden bg-background-primary text-text-primary">
      <AppSidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar />
        <TrialBanner />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <PermissionRouteGate>{children}</PermissionRouteGate>
        </main>
      </div>
    </div>
  );
}
