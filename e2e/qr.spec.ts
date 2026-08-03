import { expect, test } from "@playwright/test";
import { assertNoServerErrors } from "./helpers/session";

test("QR verification page loads without exposing internal data", async ({ page }) => {
  await assertNoServerErrors(page, "/qr");
  await expect(page.locator("body")).not.toContainText(/access_token|refresh_token|Bearer\s+[A-Za-z0-9._-]{20,}/i);
});
