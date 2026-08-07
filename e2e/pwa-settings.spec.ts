import { expect, test } from "@playwright/test";

async function seedSession(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "pwa-e2e-access-token");
    localStorage.setItem(
      "user",
      JSON.stringify({ id: "pwa-user", role: "user", displayName: "PWA User" }),
    );
  });
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
}

test("settings page shows complete device guides without horizontal overflow", async ({
  page,
}) => {
  await seedSession(page);
  await page.goto("/profile/settings", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Cài đặt AntiFake", level: 1 })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Máy tính" })).toBeVisible();
  await expect(page.getByAltText(/Chrome hoặc Edge/)).toHaveCount(1);

  await page.getByRole("tab", { name: "Android" }).click();
  await expect(
    page.getByRole("heading", { name: "Chrome trên Android" }),
  ).toBeVisible();
  await expect(page.getByAltText(/Chrome Android/)).toBeVisible();

  await page.getByRole("tab", { name: "iPhone/iPad" }).click();
  await expect(page.getByText("Safari trên iPhone/iPad")).toBeVisible();
  await expect(page.getByAltText(/Thêm vào Màn hình chính/)).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("install action appears only after browser emits beforeinstallprompt", async ({
  page,
}) => {
  await seedSession(page);
  await page.goto("/profile/settings", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Cài đặt AntiFake" })).toHaveCount(0);

  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.defineProperties(event, {
      prompt: { value: () => Promise.resolve() },
      userChoice: { value: Promise.resolve({ outcome: "accepted" }) },
    });
    window.dispatchEvent(event);
  });

  await page.getByRole("button", { name: "Cài đặt AntiFake" }).click();
  await expect(page.getByText("AntiFake đã được cài trên thiết bị này")).toBeVisible();
  await expect(page.getByRole("button", { name: "Cài đặt AntiFake" })).toHaveCount(0);
});

test("Chrome on iOS defaults to Safari fallback and never shows install action", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/140.0 Mobile/15E148 Safari/604.1",
    });
  });
  await seedSession(page);
  await page.goto("/profile/settings", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("tab", { name: "iPhone/iPad" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    page.getByText("Để cài AntiFake trên iPhone/iPad, hãy mở trang này bằng Safari."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Cài đặt AntiFake" })).toHaveCount(0);
});
