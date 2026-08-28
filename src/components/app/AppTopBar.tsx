"use client";

import { useState } from "react";
import { useAppUser } from "../../hooks/workspace/useWorkspace";
import { IconHelp } from "./icons";
import { HelpCenterModal } from "./HelpCenterModal";
import { NotificationBell } from "./NotificationBell";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppTopBar() {
  const { user, logout } = useAppUser();
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-end gap-1.5 border-b border-border-subtle bg-background-primary px-4 lg:px-6">
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-surface-card hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
          aria-label="Help and FAQ"
          title="Help & FAQ"
        >
          <IconHelp className="h-[18px] w-[18px]" />
        </button>
        <NotificationBell />

        <div className="ml-1 flex items-center gap-2 border-l border-border-subtle pl-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated text-[11px] font-semibold text-text-primary"
            title={user.email}
          >
            {initials(user.name)}
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="hidden text-[12px] font-medium text-text-secondary transition-colors hover:text-brand-primary sm:inline"
          >
            Sign out
          </button>
        </div>
      </header>

      <HelpCenterModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
