import { authFetch, getToken } from "../ultil/auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type LiveSessionStatus =
  | "SCHEDULED"
  | "LIVE"
  | "ENDED"
  | "CANCELLED";

export type LiveOffer = {
  offerId: string;
  title: string;
  price: number;
  currency: string;
  availableQuantity: number;
  thumbnailUrl?: string | null;
};

export type LiveVoucher = {
  voucherId: string;
  code: string;
  name: string;
  discountType: string;
  percentage?: number | null;
  fixedAmount?: number | null;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  startsAt: string;
  endsAt: string;
};

export type LiveSession = {
  id: string;
  shopId: string;
  shopName: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  startAt: string;
  status: LiveSessionStatus;
  playbackUrl?: string | null;
  streamProvider?: string | null;
  streamLatencyTargetMs?: number | null;
  providerStatus?: string | null;
  actualStartedAt?: string | null;
  actualEndedAt?: string | null;
  recordingUrl?: string | null;
  recordingRetentionDays?: number | null;
  reminderCount: number;
  viewerHasReminder: boolean;
  offers: LiveOffer[];
  vouchers: LiveVoucher[];
  createdAt: string;
};

export type BroadcastCredentials = {
  ingestUrl: string;
  streamKey: string;
};

export type CreateLiveSessionInput = {
  shopId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  startAt: string;
  offerIds: string[];
  voucherIds?: string[];
};

export type CreatedLiveSession = LiveSession & {
  broadcastCredentials?: BroadcastCredentials;
};

export type LiveComment = {
  id: string;
  sessionId: string;
  authorUserId: string;
  authorName: string;
  body: string;
  visibility: "PUBLIC" | "HIDDEN";
  clientMessageId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LiveReactionAggregate = {
  liveSessionId: string;
  totals: Record<"LIKE" | "LOVE" | "WOW" | "FIRE", number>;
  total: number;
};

export type LiveAnalytics = {
  liveSessionId: string;
  currentViewers: number;
  reminderCount: number;
  commentCount: number;
  conversionCount: number;
  unitsSold: number;
  grossRevenue: number;
  reactions: LiveReactionAggregate;
};

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : "Không thể xử lý yêu cầu livestream";
    throw new Error(message);
  }
  return (payload?.data ?? payload) as T;
}

export async function listLiveSessions(input: {
  filter?: "all" | "live" | "upcoming";
  q?: string;
  shopId?: string;
} = {}): Promise<LiveSession[]> {
  const query = new URLSearchParams();
  if (input.filter) query.set("filter", input.filter);
  if (input.q?.trim()) query.set("q", input.q.trim());
  if (input.shopId) query.set("shopId", input.shopId);
  const url = `${BASE_URL}/api/live/sessions?${query.toString()}`;
  const response = getToken()
    ? await authFetch(url, { headers: { Accept: "application/json" } })
    : await fetch(url, { headers: { Accept: "application/json" } });
  return readJson<LiveSession[]>(response);
}

export async function getLiveSession(
  sessionId: string,
): Promise<LiveSession> {
  const url = `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}`;
  const response = getToken()
    ? await authFetch(url, { headers: { Accept: "application/json" } })
    : await fetch(url, { headers: { Accept: "application/json" } });
  return readJson<LiveSession>(response);
}

export async function createLiveSession(
  input: CreateLiveSessionInput,
): Promise<CreatedLiveSession> {
  const response = await authFetch(`${BASE_URL}/api/live/sessions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return readJson<CreatedLiveSession>(response);
}

export async function getBroadcastCredentials(
  sessionId: string,
): Promise<BroadcastCredentials> {
  const response = await authFetch(
    `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}/broadcast-credentials`,
    { method: "POST", headers: { Accept: "application/json" } },
  );
  return readJson<BroadcastCredentials>(response);
}

export async function startLiveSession(
  sessionId: string,
): Promise<LiveSession> {
  const response = await authFetch(
    `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}/start`,
    { method: "POST", headers: { Accept: "application/json" } },
  );
  return readJson<LiveSession>(response);
}

export async function refreshLiveRecording(
  sessionId: string,
): Promise<{ ready: boolean; recordingUrl?: string }> {
  const response = await authFetch(
    `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}/recording/refresh`,
    { method: "POST", headers: { Accept: "application/json" } },
  );
  return readJson<{ ready: boolean; recordingUrl?: string }>(response);
}

export async function updateLiveSessionStatus(
  sessionId: string,
  status: Extract<LiveSessionStatus, "ENDED" | "CANCELLED">,
): Promise<LiveSession> {
  const response = await authFetch(
    `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}/status`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    },
  );
  return readJson<LiveSession>(response);
}

export async function remindLiveSession(
  sessionId: string,
): Promise<LiveSession> {
  const response = await authFetch(
    `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}/reminders`,
    { method: "POST", headers: { Accept: "application/json" } },
  );
  return readJson<LiveSession>(response);
}

export async function listLiveComments(
  sessionId: string,
  includeHidden = false,
): Promise<LiveComment[]> {
  const url =
    `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}` +
    `/comments?pageSize=100${includeHidden ? "&includeHidden=true" : ""}`;
  const response = includeHidden
    ? await authFetch(url, { headers: { Accept: "application/json" } })
    : await fetch(url, { headers: { Accept: "application/json" } });
  return readJson<LiveComment[]>(response);
}

export async function getLiveReactionAggregate(
  sessionId: string,
): Promise<LiveReactionAggregate> {
  const response = await fetch(
    `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}/reactions`,
    { headers: { Accept: "application/json" } },
  );
  return readJson<LiveReactionAggregate>(response);
}

export async function getLiveAnalytics(
  sessionId: string,
): Promise<LiveAnalytics> {
  const response = await authFetch(
    `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}/analytics`,
    { headers: { Accept: "application/json" } },
  );
  return readJson<LiveAnalytics>(response);
}

export async function updateLiveCommentVisibility(
  sessionId: string,
  commentId: string,
  visibility: "PUBLIC" | "HIDDEN",
): Promise<LiveComment> {
  const response = await authFetch(
    `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}/comments/${encodeURIComponent(commentId)}/visibility`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ visibility }),
    },
  );
  return readJson<LiveComment>(response);
}
