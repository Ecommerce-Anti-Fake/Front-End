import { create } from "zustand";

import { fetchNotifications } from "../services/notification.api";

type NotificationStore = {
  unreadCount: number;
  unreadChatCount: number;
  refreshNotifications: () => Promise<void>;
  resetNotifications: () => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,
  unreadChatCount: 0,

  refreshNotifications: async () => {
    try {
      const data = await fetchNotifications({
        filter: "unread",
        page: 1,
        pageSize: 100,
      });

      set({
        unreadCount: data.unreadCount,
        unreadChatCount: data.unreadChatCount,
      });
    } catch {
      // Keep the last known count during a transient network failure.
    }
  },

  resetNotifications: () =>
    set({
      unreadCount: 0,
      unreadChatCount: 0,
    }),
}));
