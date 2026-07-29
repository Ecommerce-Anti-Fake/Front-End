import { authFetch, getToken } from "../ultil/auth";
import {
  buildLiveSessionFormData,
  type CreateLiveSessionFormInput,
} from "./live-form";

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

export type PinnedLiveOffer = {
  id: string;
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
  streamProvider?: string | null;
  streamLatencyTargetMs?: number | null;
  providerStatus?: string | null;
  actualStartedAt?: string | null;
  actualEndedAt?: string | null;
  reminderCount: number;
  viewerHasReminder: boolean;
  pinnedOfferId: string | null;
  pinnedOffer: PinnedLiveOffer | null;
  offers: LiveOffer[];
  vouchers: LiveVoucher[];
  createdAt: string;
};

export type CreateLiveSessionInput = CreateLiveSessionFormInput;

export type AgoraRtcAccess = {
  appId: string;
  channelName: string;
  uid: number;
  token: string;
  role: "PUBLISHER" | "SUBSCRIBER";
  expiresAt: string;
};

export type CreatedLiveSession = LiveSession & AgoraRtcAccess;

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

export type LiveMutationResult = {
  success: true;
  message: string;
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
  signal?: AbortSignal,
): Promise<LiveSession> {
  const url = `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}`;
  const response = getToken()
    ? await authFetch(url, {
        headers: { Accept: "application/json" },
        signal,
      })
    : await fetch(url, { headers: { Accept: "application/json" }, signal });
  return readJson<LiveSession>(response);
}

export async function createLiveSession(
  input: CreateLiveSessionInput,
  signal?: AbortSignal,
): Promise<CreatedLiveSession> {
  const response = await authFetch(`${BASE_URL}/api/live/sessions`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
    body: buildLiveSessionFormData(input),
    signal,
  });
  return readJson<CreatedLiveSession>(response);
}

export async function joinLiveSession(
  sessionId: string,
  clientId: string,
  role?: "PUBLISHER" | "SUBSCRIBER",
  signal?: AbortSignal,
): Promise<AgoraRtcAccess> {
  const url = `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}/join`;
  const init: RequestInit = {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ clientId, ...(role ? { role } : {}) }),
    signal,
  };
  const response = getToken()
    ? await authFetch(url, init)
    : await fetch(url, init);
  return readJson<AgoraRtcAccess>(response);
}

export async function heartbeatLivePublisherLease(
  sessionId: string,
  clientId: string,
  signal?: AbortSignal,
): Promise<LiveMutationResult> {
  const response = await authFetch(
    `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}/publisher-lease/heartbeat`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clientId }),
      signal,
    },
  );
  return readJson<LiveMutationResult>(response);
}

export async function releaseLivePublisherLease(
  sessionId: string,
  clientId: string,
  signal?: AbortSignal,
): Promise<LiveMutationResult> {
  const response = await authFetch(
    `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}/publisher-lease`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clientId }),
      signal,
    },
  );
  return readJson<LiveMutationResult>(response);
}

export async function updateLivePinnedOffer(
  sessionId: string,
  offerId: string | null,
): Promise<LiveMutationResult> {
  const response = await authFetch(
    `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}/pinned-offer`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ offerId }),
    },
  );
  return readJson<LiveMutationResult>(response);
}

export async function replaceLiveSessionOffers(
  sessionId: string,
  offerIds: string[],
): Promise<LiveMutationResult> {
  const response = await authFetch(
    `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}/offers`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ offerIds }),
    },
  );
  return readJson<LiveMutationResult>(response);
}

export async function startLiveSession(
  sessionId: string,
  signal?: AbortSignal,
): Promise<LiveSession> {
  const response = await authFetch(
    `${BASE_URL}/api/live/sessions/${encodeURIComponent(sessionId)}/start`,
    { method: "POST", headers: { Accept: "application/json" }, signal },
  );
  return readJson<LiveSession>(response);
}

export async function updateLiveSessionStatus(
  sessionId: string,
  status: Extract<LiveSessionStatus, "ENDED" | "CANCELLED">,
  signal?: AbortSignal,
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
      signal,
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
