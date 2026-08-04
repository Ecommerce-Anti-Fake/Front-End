import { authFetch } from "../ultil/auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type NotificationFilter = "all" | "unread" | "readed";

export type UserNotification = {
  id: string;
  title: string;
  message: string;
  type?: string;
  readAt?: string | null;
  createdAt?: string;
};

export type NotificationPage = {
  items: UserNotification[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  unreadCount: number;
  unreadChatCount: number;
};

type FetchNotificationParams = {
  filter: NotificationFilter;
  page: number;
  pageSize: number;
};

const toNotification = (value: unknown): UserNotification | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = record.id ?? record.notificationId;
  if (typeof id !== "string" && typeof id !== "number") return null;

  return {
    id: String(id),
    title: String(record.title ?? record.subject ?? "Thông báo"),
    message: String(record.message ?? record.content ?? record.body ?? ""),
    type:
      typeof record.type === "string"
        ? record.type
        : typeof record.notificationType === "string"
          ? record.notificationType
          : undefined,
    readAt: typeof record.readAt === "string" ? record.readAt : null,
    createdAt:
      typeof record.createdAt === "string"
        ? record.createdAt
        : typeof record.sentAt === "string"
          ? record.sentAt
          : undefined,
  };
};

export const fetchNotifications = async ({
  filter,
  page,
  pageSize,
}: FetchNotificationParams): Promise<NotificationPage> => {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (filter !== "all") query.set("filter", filter);

  const response = await authFetch(
    `${BASE_URL}/api/user/notifications?${query.toString()}`,
    { headers: { Accept: "application/json" } },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Không thể tải danh sách thông báo");
  }

  const payload = data?.data ?? data;
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.notifications)
        ? payload.notifications
        : [];
  const items = rawItems
    .map(toNotification)
    .filter((item: UserNotification | null): item is UserNotification =>
      Boolean(item),
    );
  const pagination = payload?.pagination ?? data?.pagination ?? {};
  const totalItems = Number(
    payload?.totalItems ??
      data?.totalItems ??
      pagination.totalItems ??
      payload?.total ??
      data?.total ??
      items.length,
  );
  const normalizedPageSize = Math.max(
    1,
    Number(payload?.pageSize ?? pagination.pageSize ?? pageSize),
  );
  const unreadCount = Math.max(
    0,
    Number(
      payload?.unreadCount ??
        data?.unreadCount ??
        (filter === "unread"
          ? totalItems
          : items.filter((item: UserNotification) => !item.readAt).length),
    ),
  );
  const unreadChatCount = Math.max(
    0,
    Number(
      payload?.unreadChatCount ??
        data?.unreadChatCount ??
        items.filter(
          (item: UserNotification) =>
            !item.readAt && item.type === "CHAT_MESSAGE",
        ).length,
    ),
  );

  return {
    items,
    page: Number(payload?.page ?? data?.page ?? pagination.page ?? page),
    pageSize: normalizedPageSize,
    totalItems,
    totalPages: Number(
      payload?.totalPages ??
        data?.totalPages ??
        pagination.totalPages ??
        Math.max(1, Math.ceil(totalItems / normalizedPageSize)),
    ),
    unreadCount,
    unreadChatCount,
  };
};

const postNotificationAction = async (path: string): Promise<void> => {
  const response = await authFetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Không thể cập nhật trạng thái thông báo");
  }
};

export const markNotificationAsRead = (notificationId: string) =>
  postNotificationAction(
    `/api/user/notifications/${encodeURIComponent(notificationId)}/read`,
  );

export const markAllNotificationsAsRead = () =>
  postNotificationAction("/api/user/notifications/read-all");
