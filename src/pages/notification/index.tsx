import {
  Bell,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationFilter,
  type NotificationPage as NotificationPageData,
} from "../../services/notification.api";
import { useNotificationStore } from "../../store/notificationStore";
import "../../css/pages/notification.css";

const PAGE_SIZE = 20;

const filters: Array<{ value: NotificationFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "unread", label: "Chưa đọc" },
  { value: "readed", label: "Đã đọc" },
];

const initialPage: NotificationPageData = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
  unreadCount: 0,
  unreadChatCount: 0,
};

const formatTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

export default function NotificationPage() {
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [page, setPage] = useState(1);
  const [requestVersion, setRequestVersion] = useState(0);
  const [data, setData] = useState<NotificationPageData>(initialPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const refreshUnreadNotifications = useNotificationStore(
    (state) => state.refreshNotifications,
  );

  useEffect(() => {
    let cancelled = false;

    fetchNotifications({ filter, page, pageSize: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không thể tải danh sách thông báo",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter, page, requestVersion]);

  const selectFilter = (nextFilter: NotificationFilter) => {
    setLoading(true);
    setFilter(nextFilter);
    setPage(1);
  };

  const changePage = (nextPage: number) => {
    setLoading(true);
    setPage(nextPage);
  };

  const retry = () => {
    setLoading(true);
    setRequestVersion((current) => current + 1);
  };

  const applyReadState = (ids?: Set<string>) => {
    const readAt = new Date().toISOString();
    setData((current) => {
      const markedCount = current.items.filter(
        (item) => !item.readAt && (!ids || ids.has(item.id)),
      ).length;
      const items = current.items.map((item) =>
        !item.readAt && (!ids || ids.has(item.id)) ? { ...item, readAt } : item,
      );

      return filter === "unread"
        ? {
            ...current,
            items: items.filter((item) => !item.readAt),
            totalItems: ids ? Math.max(0, current.totalItems - markedCount) : 0,
            totalPages: ids ? current.totalPages : 1,
          }
        : { ...current, items };
    });
  };

  const markOneAsRead = async (notificationId: string) => {
    setMarkingId(notificationId);
    setActionError("");
    try {
      await markNotificationAsRead(notificationId);
      applyReadState(new Set([notificationId]));
      void refreshUnreadNotifications();
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Không thể cập nhật thông báo");
    } finally {
      setMarkingId(null);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    setActionError("");
    try {
      await markAllNotificationsAsRead();
      applyReadState();
      void refreshUnreadNotifications();
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Không thể cập nhật thông báo");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <main className="notification-page">
      <section className="notification-shell">
        <header className="notification-header">
          <div>
            <span className="notification-eyebrow">Trung tâm thông báo</span>
            <h1>Thông báo</h1>
            <p>Theo dõi các cập nhật mới nhất liên quan đến tài khoản của bạn.</p>
          </div>
          <div className="notification-total">
            <Bell size={18} />
            <span>{data.totalItems} thông báo</span>
          </div>
        </header>

        <div className="notification-toolbar">
          <div className="notification-filters" role="tablist" aria-label="Lọc thông báo">
            {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              className={filter === item.value ? "active" : ""}
              onClick={() => selectFilter(item.value)}
            >
              {item.label}
            </button>
            ))}
          </div>
          <button
            type="button"
            className="notification-read-all"
            disabled={filter === "readed" || data.totalItems === 0 || markingAll || markingId !== null}
            onClick={markAllAsRead}
          >
            <Check size={16} />
            {markingAll ? "Đang cập nhật..." : "Đánh dấu tất cả đã đọc"}
          </button>
        </div>

        {actionError && <p className="notification-action-error" role="alert">{actionError}</p>}

        {loading ? (
          <div className="notification-skeleton" aria-busy="true" aria-label="Đang tải thông báo">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="notification-skeleton-item" key={index}>
                <span className="notification-skeleton-icon" />
                <span className="notification-skeleton-content">
                  <span className="notification-skeleton-line title" />
                  <span className="notification-skeleton-line message" />
                  <span className="notification-skeleton-line time" />
                </span>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="notification-state notification-error" role="alert">
            <Inbox size={28} />
            <strong>Không thể tải thông báo</strong>
            <p>{error}</p>
            <button type="button" onClick={retry}>Thử lại</button>
          </div>
        ) : data.items.length === 0 ? (
          <div className="notification-state">
            <CheckCircle2 size={30} />
            <strong>Không có thông báo</strong>
            <p>Bạn đã xem hết các cập nhật trong mục này.</p>
          </div>
        ) : (
          <div className="notification-list">
            {data.items.map((notification) => {
              const unread = !notification.readAt;
              return (
                <article
                  key={notification.id}
                  className={`notification-item ${unread ? "unread" : ""}`}
                >
                  <div className="notification-icon" aria-hidden="true">
                    <Bell size={18} />
                  </div>
                  <div className="notification-content">
                    <div className="notification-title-row">
                      <h2>{notification.title}</h2>
                      {unread && <span className="notification-title-actions">
                        <button
                          type="button"
                          className="notification-read-button"
                          disabled={markingId === notification.id || markingAll}
                          onClick={() => markOneAsRead(notification.id)}
                        >
                          <Check size={14} />
                          {markingId === notification.id ? "Đang cập nhật..." : "Đánh dấu đã đọc"}
                        </button>
                        <span className="notification-unread-dot" role="img" aria-label="Chưa đọc" />
                      </span>}
                    </div>
                    {notification.message && <p>{notification.message}</p>}
                    <time dateTime={notification.createdAt}>
                      {formatTime(notification.createdAt)}
                    </time>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && data.totalPages > 1 && (
          <nav className="notification-pagination" aria-label="Phân trang thông báo">
            <button
              type="button"
              disabled={data.page <= 1}
              onClick={() => changePage(data.page - 1)}
              aria-label="Trang trước"
            >
              <ChevronLeft size={18} />
            </button>
            <span>Trang {data.page} / {data.totalPages}</span>
            <button
              type="button"
              disabled={data.page >= data.totalPages}
              onClick={() => changePage(data.page + 1)}
              aria-label="Trang sau"
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}
