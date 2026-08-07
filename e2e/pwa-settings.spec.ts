import { expect, test } from "@playwright/test";

test("settings page shows complete device guides without horizontal overflow", async ({
  page,
}) => {
  await page.goto("/install", { waitUntil: "domcontentloaded" });

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

test("legacy profile settings URL redirects guests to the public install page", async ({
  page,
}) => {
  await page.goto("/profile/settings", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/install$/);
  await expect(
    page.getByRole("heading", { name: "Cài đặt AntiFake", level: 1 }),
  ).toBeVisible();
});

test("install action appears only after browser emits beforeinstallprompt", async ({
  page,
}) => {
  await page.goto("/install", { waitUntil: "domcontentloaded" });
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
  await page.goto("/install", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("tab", { name: "iPhone/iPad" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    page.getByText("Để cài AntiFake trên iPhone/iPad, hãy mở trang này bằng Safari."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Cài đặt AntiFake" })).toHaveCount(0);
});

test("mobile header exposes the public AntiFake install entry", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/auth", { waitUntil: "domcontentloaded" });

  const installLink = page.getByRole("link", { name: "Cài đặt AntiFake" });
  await expect(installLink).toBeVisible();
  await installLink.click();
  await expect(page).toHaveURL(/\/install$/);
});

test("mobile header hides the install entry after installation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("antifake.pwaInstalled", "true");
  });
  await page.goto("/auth", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("link", { name: "Cài đặt AntiFake" }),
  ).toHaveCount(0);
});
