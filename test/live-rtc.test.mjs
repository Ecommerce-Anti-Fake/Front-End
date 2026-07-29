import assert from "node:assert/strict";
import test from "node:test";
import {
  createPreparationGate,
  getLiveMediaErrorMessage,
  getOrCreateLiveRtcClientId,
  isCompatibleRtcAccess,
  shouldKeepPublishingAfterStartFailure,
} from "../src/services/live-rtc.ts";
import {
  buildLiveSessionFormData,
  createLiveCoverPreview,
  validateLiveCoverFile,
} from "../src/services/live-form.ts";
import {
  isLiveOfferSoldOut,
  isPinnedOfferEventForSession,
} from "../src/services/live-offer.ts";

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

test("maps unsupported media constraints to an actionable message", () => {
  assert.match(
    getLiveMediaErrorMessage({ name: "OverconstrainedError" }),
    /không hỗ trợ/,
  );
});

test("validates live cover type and hard size limit before submit", () => {
  assert.equal(
    validateLiveCoverFile(
      new File(["image"], "cover.webp", { type: "image/webp" }),
    ),
    null,
  );
  assert.match(
    validateLiveCoverFile(
      new File(["image"], "cover.gif", { type: "image/gif" }),
    ) ?? "",
    /JPG, PNG hoặc WebP/,
  );
  assert.match(
    validateLiveCoverFile(
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "cover.png", {
        type: "image/png",
      }),
    ) ?? "",
    /5 MB/,
  );
});

test("builds repeated multipart fields without coverUrl", () => {
  const coverImage = new File(["image"], "cover.jpg", {
    type: "image/jpeg",
  });
  const formData = buildLiveSessionFormData({
    clientId: "43dcb68d-6ce0-4f9d-87de-b4e32dd62533",
    shopId: "7da5f34f-1357-4df0-8813-bcbe857ce748",
    title: "Live sale",
    description: "Demo",
    startAt: "2030-01-01T00:00:00.000Z",
    offerIds: ["offer-1", "offer-2"],
    voucherIds: ["voucher-1"],
    coverImage,
  });

  assert.deepEqual(formData.getAll("offerIds"), ["offer-1", "offer-2"]);
  assert.deepEqual(formData.getAll("voucherIds"), ["voucher-1"]);
  assert.equal(formData.get("coverImage"), coverImage);
  assert.equal(formData.has("coverUrl"), false);
});

test("shares one preparation promise and can be cleared for retry", async () => {
  let calls = 0;
  const gate = createPreparationGate(async () => {
    calls += 1;
    await Promise.resolve();
    return calls;
  });

  const first = gate.run();
  const second = gate.run();
  assert.equal(first, second);
  assert.equal(await first, 1);
  assert.equal(await gate.run(), 1);

  gate.clear();
  assert.equal(await gate.run(), 2);
});

test("revokes a replaced live cover preview exactly once", () => {
  const revoked = [];
  const preview = createLiveCoverPreview(
    new File(["image"], "cover.jpg", { type: "image/jpeg" }),
    () => "blob:cover-preview",
    (url) => revoked.push(url),
  );

  assert.equal(preview.url, "blob:cover-preview");
  preview.revoke();
  preview.revoke();
  assert.deepEqual(revoked, ["blob:cover-preview"]);
});

test("recovers only matching pinned events and treats zero quantity as sold out", () => {
  assert.equal(
    isPinnedOfferEventForSession("live-1", { sessionId: "live-1" }),
    true,
  );
  assert.equal(
    isPinnedOfferEventForSession("live-1", { sessionId: "live-2" }),
    false,
  );
  assert.equal(isLiveOfferSoldOut(0), true);
  assert.equal(isLiveOfferSoldOut(1), false);
});
