import { useEffect } from "react";

import { useNotificationStore } from "../store/notificationStore";
import { getToken } from "../ultil/auth";

const REFRESH_INTERVAL_MS = 30_000;

export function useHeaderUnreadCounts(pathname: string) {
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const unreadChatCount = useNotificationStore((state) => state.unreadChatCount);
  const refreshNotifications = useNotificationStore(
    (state) => state.refreshNotifications,
  );
  const resetNotifications = useNotificationStore(
    (state) => state.resetNotifications,
  );

  useEffect(() => {
    if (pathname === "/auth" || !getToken()) {
      resetNotifications();
      return;
    }

    void refreshNotifications();
    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, REFRESH_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, refreshNotifications, resetNotifications]);

  return { unreadCount, unreadChatCount };
}
