"use client";

import { useEffect, useId, useState } from "react";
import { APP_NAME } from "../../lib/brand";
import { isOwnerOrAdminRole } from "../../lib/app-nav";
import { useRequiredWorkspace } from "../../hooks/workspace/useWorkspace";
import { IconChevronLeft, IconHelp, IconX } from "./icons";
import { ADMIN_HELP_FAQ, MEMBER_HELP_FAQ } from "./app-help-faq";

type HelpCenterModalProps = {
  open: boolean;
  onClose: () => void;
};

export function HelpCenterModal({ open, onClose }: HelpCenterModalProps) {
  const titleId = useId();
  const { user, organization, role } = useRequiredWorkspace();
  const isAdminGuide = isOwnerOrAdminRole(role);
  const items = isAdminGuide ? ADMIN_HELP_FAQ : MEMBER_HELP_FAQ;
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (!open) return;
    setOpenId(items[0]?.id ?? null);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, items]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[min(640px,90vh)] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-card shadow-elevated"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-brand-primary/10 text-brand-primary">
                <IconHelp className="h-4 w-4" />
              </span>
              <div>
                <h2
                  id={titleId}
                  className="text-[15px] font-semibold text-text-primary"
                >
                  Help & FAQ
                </h2>
                <p className="text-[11px] text-text-muted">
                  {isAdminGuide ? "Owner / Admin guide" : "Member guide"}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[12px] leading-snug text-text-secondary">
              Signed in as{" "}
              <span className="font-medium text-text-primary">{user.name}</span>{" "}
              · {role.name} at{" "}
              <span className="font-medium text-text-primary">
                {organization.name}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
            aria-label="Close help"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-4 text-[12px] leading-relaxed text-text-secondary">
            {isAdminGuide
              ? `Common questions for managing ${APP_NAME} — invitations, access control, audit, and plans.`
              : `Common questions for using ${APP_NAME} safely — secrets, access requests, and account protection.`}
          </p>

          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {items.map((item) => {
              const expanded = openId === item.id;
              return (
                <li
                  key={item.id}
                  className="overflow-hidden rounded-md border border-border-subtle bg-background-secondary/40"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left focus-visible:outline-none focus-visible:shadow-focus"
                    aria-expanded={expanded}
                    onClick={() =>
                      setOpenId((current) =>
                        current === item.id ? null : item.id,
                      )
                    }
                  >
                    <span className="text-[13px] font-medium text-text-primary">
                      {item.question}
                    </span>
                    <IconChevronLeft
                      className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-fast ${
                        expanded ? "rotate-90" : "-rotate-90"
                      }`}
                    />
                  </button>
                  {expanded ? (
                    <div className="border-t border-border-subtle px-3.5 py-3 text-[12px] leading-relaxed text-text-secondary">
                      {item.answer}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-border-subtle px-5 py-3">
          <p className="text-[11px] text-text-muted">
            Need more help? Contact your workspace{" "}
            {isAdminGuide ? "support channel" : "Owner or Admin"}.
          </p>
        </div>
      </div>
    </div>
  );
}
