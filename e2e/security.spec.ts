import { expect, test } from "@playwright/test";

const protectedApiRoutes = [
  "/api/admin/dashboard",
  "/api/admin/users",
  "/api/cart",
  "/api/orders/mine",
  "/api/affiliate/accounts/mine",
];

test.describe("backend authorization without a token", () => {
  for (const route of protectedApiRoutes) {
    test(`${route} rejects an unauthenticated request`, async ({ request }) => {
      const apiBaseUrl = process.env.UAT_API_BASE_URL;
      test.skip(!apiBaseUrl, "UAT_API_BASE_URL is required for direct API authorization checks");

      const response = await request.get(`${apiBaseUrl}${route}`, {
        headers: { Accept: "application/json" },
      });
      expect([401, 403], `${route} must remain protected`).toContain(response.status());
    });
  }
});
