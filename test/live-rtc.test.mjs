import assert from "node:assert/strict";
import test from "node:test";
import {
  getLiveMediaErrorMessage,
  getOrCreateLiveRtcClientId,
  isCompatibleRtcAccess,
  shouldKeepPublishingAfterStartFailure,
} from "../src/services/live-rtc.ts";

function createStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem() {
      return value;
    },
    setItem(_key, nextValue) {
      value = nextValue;
    },
  };
}

test("reuses a valid tab-scoped RTC client id", () => {
  const clientId = "43dcb68d-6ce0-4f9d-87de-b4e32dd62533";
  const storage = createStorage(clientId);

  assert.equal(
    getOrCreateLiveRtcClientId(storage, () => crypto.randomUUID()),
    clientId,
  );
});

test("replaces an invalid RTC client id with a generated UUID", () => {
  const generated = "f57568f5-fb3a-4676-bb83-1a26cd21d529";
  const storage = createStorage("not-a-uuid");

  assert.equal(getOrCreateLiveRtcClientId(storage, () => generated), generated);
  assert.equal(storage.getItem(), generated);
});

test("replaces a non-v4 UUID rejected by the backend contract", () => {
  const generated = "f57568f5-fb3a-4676-bb83-1a26cd21d529";
  const storage = createStorage("43dcb68d-6ce0-1f9d-87de-b4e32dd62533");

  assert.equal(getOrCreateLiveRtcClientId(storage, () => generated), generated);
  assert.equal(storage.getItem(), generated);
});

test("accepts renewed access only for the same channel, uid, and role", () => {
  const current = {
    appId: "app-id",
    channelName: "live_channel",
    uid: 42,
    role: "SUBSCRIBER",
  };

  assert.equal(
    isCompatibleRtcAccess(current, {
      ...current,
      token: "renewed",
      expiresAt: "2030-01-01T00:00:00.000Z",
    }),
    true,
  );
  assert.equal(
    isCompatibleRtcAccess(current, {
      ...current,
      uid: 43,
      token: "wrong-user",
      expiresAt: "2030-01-01T00:00:00.000Z",
    }),
    false,
  );
});

test("maps browser and Agora device failures to actionable messages", () => {
  assert.equal(
    getLiveMediaErrorMessage({ name: "NotAllowedError" }),
    "Hãy cho phép trình duyệt sử dụng camera và micro",
  );
  assert.equal(
    getLiveMediaErrorMessage({ code: "DEVICE_NOT_FOUND" }),
    "Không tìm thấy camera hoặc micro",
  );
});

test("keeps publishing after a start error only when canonical status is LIVE", () => {
  assert.equal(shouldKeepPublishingAfterStartFailure("LIVE"), true);
  assert.equal(shouldKeepPublishingAfterStartFailure("SCHEDULED"), false);
  assert.equal(shouldKeepPublishingAfterStartFailure(undefined), false);
});
