"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAllNotificationsRequest,
  listNotificationsRequest,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
  type NotificationsListResponse,
} from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";
import {
  playNotificationSound,
  unlockNotificationSound,
} from "../../lib/notification-sound";
import { toast } from "../../stores/toast-store";

export function useNotificationsQuery(enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => listNotificationsRequest(),
    enabled,
    staleTime: 2_000,
    refetchInterval: 4_000,
    refetchOnWindowFocus: true,
  });

  const seenRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);

  useEffect(() => {
    unlockNotificationSound();
  }, []);

  useEffect(() => {
    const items = query.data?.notifications;
    if (!items) return;

    if (!primedRef.current) {
      for (const n of items) seenRef.current.add(n.id);
      primedRef.current = true;
      return;
    }

    const fresh = items.filter((n) => !seenRef.current.has(n.id));
    if (fresh.length === 0) return;

    for (const n of fresh) seenRef.current.add(n.id);
    playNotificationSound();
    const latest = fresh[0]!;
    toast.info(latest.title, latest.body);
  }, [query.data?.notifications]);

  return query;
}

function snapshotNotifications(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.getQueryData<NotificationsListResponse>(
    queryKeys.notifications,
  );
}

/** Mark one read — UI updates immediately. */
export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationReadRequest(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = snapshotNotifications(queryClient);
      const now = new Date().toISOString();
      queryClient.setQueryData<NotificationsListResponse>(
        queryKeys.notifications,
        (old) => {
          if (!old) return old;
          let unreadDelta = 0;
          const notifications = old.notifications.map((n) => {
            if (n.id !== notificationId || n.readAt) return n;
            unreadDelta += 1;
            return { ...n, readAt: now };
          });
          return {
            notifications,
            unreadCount: Math.max(0, old.unreadCount - unreadDelta),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.notifications, ctx.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications,
      });
    },
  });
}

/** Mark all read — UI updates immediately. */
export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsReadRequest(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = snapshotNotifications(queryClient);
      const now = new Date().toISOString();
      queryClient.setQueryData<NotificationsListResponse>(
        queryKeys.notifications,
        (old) => {
          if (!old) return old;
          return {
            notifications: old.notifications.map((n) =>
              n.readAt ? n : { ...n, readAt: now },
            ),
            unreadCount: 0,
          };
        },
      );
      return { previous };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.notifications, ctx.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications,
      });
    },
  });
}

/** Clear all — list empties immediately. */
export function useDeleteAllNotificationsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteAllNotificationsRequest(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = snapshotNotifications(queryClient);
      queryClient.setQueryData<NotificationsListResponse>(
        queryKeys.notifications,
        { notifications: [], unreadCount: 0 },
      );
      return { previous };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.notifications, ctx.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications,
      });
    },
  });
}
