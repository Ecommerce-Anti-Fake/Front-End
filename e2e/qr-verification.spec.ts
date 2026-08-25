import path from "node:path";
import { expect, test } from "@playwright/test";

test.describe("QR product verification", () => {
  test("renders the server-owned verified result", async ({ page }) => {
    await page.route("**/api/verifications**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "VERIFIED",
          labelType: "QR_BATCH",
          issuedAt: "2026-08-01T00:00:00.000Z",
          brandName: "Brand ABC",
          productName: "Product One",
          modelName: "Model One",
          batchNumber: "BATCH-0001",
          countryOfOrigin: "Viet Nam",
          sourceType: "MANUFACTURING",
          provenance: [],
        }),
      });
    });

    await page.goto("/qr");
    await page.getByTestId("verification-tab-code").click();
    await page.getByTestId("verification-code-input").fill("ABC-123");
    await page.getByTestId("verification-submit").click();

    await expect(page.getByTestId("verification-result")).toHaveAttribute(
      "data-status",
      "VERIFIED",
    );
    await expect(page.getByTestId("verification-result")).toContainText("Brand ABC");
  });

  test("renders a safe not-found state for an unknown code", async ({ page }) => {
    await page.route("**/api/verifications**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "NOT_FOUND",
          labelType: null,
          issuedAt: null,
          brandName: null,
          productName: null,
          modelName: null,
          batchNumber: null,
          countryOfOrigin: null,
          sourceType: null,
          provenance: [],
        }),
      });
    });

    await page.goto("/qr");
    await page.getByTestId("verification-tab-code").click();
    await page.getByTestId("verification-code-input").fill("UNKNOWN");
    await page.getByTestId("verification-submit").click();

    await expect(page.getByTestId("verification-result")).toHaveAttribute(
      "data-status",
      "NOT_FOUND",
    );
  });

  test("decodes a QR image before verifying the decoded value", async ({ page }) => {
    await page.route("**/api/verifications**", async (route) => {
      const requestUrl = new URL(route.request().url());
      expect(requestUrl.searchParams.get("code")).toBe("UAT-QR-IMAGE-20260825");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "VERIFIED",
          labelType: "QR_BATCH",
          issuedAt: "2026-08-01T00:00:00.000Z",
          brandName: "Brand ABC",
          productName: "Product One",
          modelName: "Model One",
          batchNumber: "BATCH-0001",
          countryOfOrigin: "Viet Nam",
          sourceType: "MANUFACTURING",
          provenance: [],
        }),
      });
    });

    await page.goto("/qr");
    await page.getByTestId("verification-file-input").setInputFiles(
      path.resolve("e2e/fixtures/qr-image.png"),
    );

    await expect(page.getByTestId("verification-result")).toHaveAttribute(
      "data-status",
      "VERIFIED",
    );
    await expect(page.getByTestId("verification-result")).toContainText("Brand ABC");
  });

  test("rejects unsupported and oversized QR files", async ({ page }) => {
    await page.goto("/qr");

    await page.getByTestId("verification-file-input").setInputFiles({
      name: "product-qr.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not-an-image"),
    });
    await expect(page.getByTestId("verification-error")).toContainText(
      "PNG, JPEG",
    );

    await page.getByTestId("verification-file-input").setInputFiles({
      name: "product-qr.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });
    await expect(page.getByTestId("verification-error")).toContainText(
      "PNG, JPEG",
    );
  });

  test("reports a useful error for an unreadable image", async ({ page }) => {
    await page.goto("/qr");
    await page.getByTestId("verification-file-input").setInputFiles({
      name: "product-qr.png",
      mimeType: "image/png",
      buffer: Buffer.from("not-an-image"),
    });

    await expect(page.getByTestId("verification-error")).toContainText(
      "Không tìm thấy mã QR",
    );
  });
});
