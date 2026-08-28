"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  useDeleteAllNotificationsMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "../../hooks/queries/useNotificationsQuery";
import { IconBell } from "./icons";

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell() {
  const { data } = useNotificationsQuery(true);
  const markRead = useMarkNotificationReadMutation();
  const markAll = useMarkAllNotificationsReadMutation();
  const deleteAll = useDeleteAllNotificationsMutation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const unread = data?.unreadCount ?? 0;
  const items = data?.notifications ?? [];

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-surface-card hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <IconBell className="h-[18px] w-[18px]" />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-bold text-brand-on-primary">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute top-full right-0 z-[90] mt-2 w-[360px] overflow-hidden rounded-md border border-border-subtle bg-surface-elevated shadow-card">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-3 py-2.5">
            <p className="text-[13px] font-semibold text-text-primary">
              Notifications
            </p>
            {items.length > 0 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={unread === 0}
                  onClick={() => markAll.mutate()}
                  className="text-[11px] font-semibold text-brand-primary hover:underline disabled:cursor-default disabled:opacity-40 disabled:no-underline"
                >
                  Mark all read
                </button>
                <span className="text-text-muted">·</span>
                <button
                  type="button"
                  onClick={() => deleteAll.mutate()}
                  className="text-[11px] font-semibold text-danger hover:underline"
                >
                  Clear all
                </button>
              </div>
            ) : null}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-8 text-center text-[12px] text-text-muted">
                No notifications yet
              </li>
            ) : (
              items.map((n) => (
                <li
                  key={n.id}
                  className="border-b border-border-subtle last:border-b-0"
                >
                  <Link
                    href={n.href || "/app"}
                    onClick={() => {
                      if (!n.readAt) markRead.mutate(n.id);
                      setOpen(false);
                    }}
                    className={`block px-3 py-2.5 no-underline transition-colors hover:bg-surface-card ${
                      n.readAt ? "opacity-70" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.readAt ? (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                      ) : (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-text-primary">
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-snug text-text-secondary">
                          {n.body}
                        </p>
                        <p className="mt-1 text-[10px] text-text-muted">
                          {formatRelative(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
