"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ActionItem = {
  id: string;
  label: string;
  tone?: "default" | "danger" | "brand";
  disabled?: boolean;
  onSelect: () => void;
};

type MenuCoords = {
  top: number;
  left: number;
  openUp: boolean;
};

/**
 * Compact ⋯ menu for table row actions.
 * Uses a fixed portal so overflow parents never clip the menu,
 * and flips upward when there is not enough space below.
 */
export function RowActionsMenu({ items }: { items: ActionItem[] }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const visible = items.filter(Boolean);

  function placeMenu() {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuWidth = 180;
    const estimatedHeight = Math.max(visible.length, 1) * 40 + 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedHeight + 12 && rect.top > estimatedHeight;
    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8,
    );
    setCoords({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left,
      openUp,
    });
  }

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    placeMenu();
    function onReposition() {
      placeMenu();
    }
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- place from open + item count
  }, [open, visible.length]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
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

  if (visible.length === 0) {
    return <span className="text-text-muted">—</span>;
  }

  const menu =
    open && coords
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            style={{
              position: "fixed",
              top: coords.openUp ? undefined : coords.top,
              bottom: coords.openUp
                ? window.innerHeight - coords.top
                : undefined,
              left: coords.left,
              width: 180,
            }}
            className="z-[80] overflow-hidden rounded-md border border-border-subtle bg-surface-elevated py-1 shadow-card"
          >
            {visible.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={`flex w-full px-3 py-2.5 text-left text-[12px] font-semibold disabled:opacity-40 ${
                  item.tone === "danger"
                    ? "text-danger hover:bg-danger/10"
                    : item.tone === "brand"
                      ? "text-brand-primary hover:bg-brand-primary/10"
                      : "text-text-primary hover:bg-surface-card"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative inline-flex" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border-default text-text-secondary hover:border-brand-primary hover:text-brand-primary"
        title="Actions"
      >
        <span className="text-[16px] leading-none tracking-widest" aria-hidden>
          ···
        </span>
      </button>
      {menu}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  danger,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-md border border-border-subtle bg-surface-card p-5 shadow-card">
        <h2 className="text-[1.05rem] font-semibold text-text-primary">{title}</h2>
        <div className="mt-2 text-[13px] text-text-secondary">{description}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="h-9 rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary hover:border-brand-primary hover:text-brand-primary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`h-9 rounded-sm px-3.5 text-[13px] font-semibold disabled:opacity-50 ${
              danger
                ? "bg-danger text-white hover:opacity-90"
                : "bg-brand-primary text-brand-on-primary hover:bg-brand-primary-hover"
            }`}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
