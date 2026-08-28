import { create } from "zustand";

export type ToastTone = "success" | "error" | "warning" | "info";

export type ToastItem = {
  id: string;
  tone: ToastTone;
  title: string;
  message?: string;
  createdAt: number;
};

type ToastState = {
  toasts: ToastItem[];
  push: (input: {
    tone: ToastTone;
    title: string;
    message?: string;
    durationMs?: number;
  }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const DEFAULT_DURATION_MS = 4500;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: ({ tone, title, message, durationMs = DEFAULT_DURATION_MS }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id, tone, title, message, createdAt: Date.now() },
      ].slice(-5),
    }));

    if (durationMs > 0) {
      window.setTimeout(() => {
        get().dismiss(id);
      }, durationMs);
    }

    return id;
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clear: () => set({ toasts: [] }),
}));

/** Imperative helpers — use outside React when needed. */
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().push({ tone: "success", title, message }),
  error: (title: string, message?: string) =>
    useToastStore.getState().push({ tone: "error", title, message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().push({ tone: "warning", title, message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().push({ tone: "info", title, message }),
};
