const CLIENT_ID_KEY = "anti-fake-live-rtc-client-id";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ClientIdStorage = Pick<Storage, "getItem" | "setItem">;

type RtcAccessIdentity = {
  appId: string;
  channelName: string;
  uid: number;
  role: "PUBLISHER" | "SUBSCRIBER";
};

export function getOrCreateLiveRtcClientId(
  storage: ClientIdStorage = window.sessionStorage,
  createId: () => string = () => crypto.randomUUID(),
): string {
  const existing = storage.getItem(CLIENT_ID_KEY);
  if (existing && UUID_PATTERN.test(existing)) return existing;

  const clientId = createId();
  storage.setItem(CLIENT_ID_KEY, clientId);
  return clientId;
}

export function isCompatibleRtcAccess(
  current: RtcAccessIdentity,
  renewed: RtcAccessIdentity,
): boolean {
  return (
    current.appId === renewed.appId &&
    current.channelName === renewed.channelName &&
    current.uid === renewed.uid &&
    current.role === renewed.role
  );
}

export function shouldKeepPublishingAfterStartFailure(
  canonicalStatus: string | undefined,
): boolean {
  return canonicalStatus === "LIVE";
}

export function getLiveMediaErrorMessage(error: unknown): string {
  const markers =
    error && typeof error === "object"
      ? [
          "name" in error ? String(error.name) : "",
          "code" in error ? String(error.code) : "",
        ]
      : [];
  if (
    markers.includes("NotAllowedError") ||
    markers.includes("PERMISSION_DENIED")
  ) {
    return "Hãy cho phép trình duyệt sử dụng camera và micro";
  }
  if (
    markers.includes("NotFoundError") ||
    markers.includes("DEVICE_NOT_FOUND")
  ) {
    return "Không tìm thấy camera hoặc micro";
  }
  if (
    markers.includes("NotReadableError") ||
    markers.includes("TRACK_IS_DISABLED")
  ) {
    return "Camera hoặc micro đang được ứng dụng khác sử dụng";
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "Không thể chuẩn bị studio";
}
